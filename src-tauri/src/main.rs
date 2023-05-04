// Prevents additional console window on Windows in release
#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

use std::ops::Range;

fn parse_git_message(text: &str) -> Vec<GitMessageNode> {
    let issue_id_re = regex::Regex::new(r"(#\d+)").unwrap();
    let mut chunks: Vec<GitMessageChunk> = vec![];
    let mut maybe_prev_range: Option<Range<usize>> = None;
    let num_cap = issue_id_re.captures_iter(text).count();
    if num_cap == 0 {
        chunks.push(GitMessageChunk {
            range: Range {
                start: 0,
                end: text.len(),
            },
            node_type: "text".to_string(),
            issue_id: None,
        });
    }
    for (i, caps) in issue_id_re.captures_iter(text).enumerate() {
        let cap = caps.get(1).unwrap();
        let start = cap.start();
        let end = cap.end();
        let range = Range { start, end };
        match maybe_prev_range {
            Some(prev_range) => {
                if prev_range.end != range.start {
                    chunks.push(GitMessageChunk {
                        range: Range {
                            start: prev_range.end,
                            end: range.start,
                        },
                        node_type: "text".to_string(),
                        issue_id: None,
                    });
                }
                chunks.push(GitMessageChunk {
                    range: range.clone(),
                    node_type: "issueId".to_string(),
                    issue_id: Some(text[range.start + 1..range.end].to_string()),
                });
            }
            None => {
                if start == 0 {
                    chunks.push(GitMessageChunk {
                        range: range.clone(),
                        node_type: "issueId".to_string(),
                        issue_id: Some(text[range.start + 1..range.end].to_string()),
                    });
                } else {
                    chunks.push(GitMessageChunk {
                        range: Range {
                            start: 0,
                            end: start,
                        },
                        node_type: "text".to_string(),
                        issue_id: None,
                    });
                    chunks.push(GitMessageChunk {
                        range: range.clone(),
                        node_type: "issueId".to_string(),
                        issue_id: Some(text[range.start + 1..range.end].to_string()),
                    });
                }
            }
        }

        let is_last_cap = i == num_cap - 1;
        if is_last_cap {
            if range.end != text.chars().count() {
                chunks.push(GitMessageChunk {
                    range: Range {
                        start: range.end,
                        end: text.len(),
                    },
                    node_type: "text".to_string(),
                    issue_id: None,
                });
            }
        }

        maybe_prev_range = Some(range);
    }

    let nodes = chunks
        .iter()
        .map(|chunk| GitMessageNode {
            node_type: chunk.node_type.clone(),
            value: (&text[chunk.range.clone()]).to_string(),
            issue_id: chunk.issue_id.clone(),
            // children: None,
        })
        .collect();

    // for chunk in chunks {
    //     let value = &text[chunk.range];
    // nodes.push(GitMessageNode {
    //     node_type: chunk.node_type,
    //     value: value.to_string(),
    //     issue_id: chunk.issue_id,
    //     children: None,
    // })
    // }

    // let pr_id_re = regex::Regex::new(r"^Merged PR (\d+).*");

    nodes
}

fn internal_parse_git(path: &str) -> Result<GitResponse, git2::Error> {
    let repo = git2::Repository::open(path)?;

    let mut revwalk = repo.revwalk()?;
    revwalk.push_head()?;
    revwalk.set_sorting(git2::Sort::TOPOLOGICAL)?;
    let mut commits: Vec<GitCommit> = vec![];

    for maybe_oid in revwalk {
        let oid = maybe_oid?;
        let commit = repo.find_commit(oid)?;

        let author = commit.author();
        let message = commit.message().unwrap_or("");
        let parent_count = commit.parent_count();

        let lines: Vec<&str> = message.split("\n").collect();
        let title = lines[0];

        commits.push(GitCommit {
            oid: oid.to_string(),
            author: GitAuthor {
                name: author.name().unwrap_or("").to_string(),
                email: author.email().unwrap_or("").to_string(),
            },
            message: message.to_string(),
            parsed_title: parse_git_message(title),
            parent_count,
        });
    }

    Ok(GitResponse {
        path: path.to_string(),
        commits,
    })
}

struct GitMessageChunk {
    range: Range<usize>,
    node_type: String,
    issue_id: Option<String>,
}

#[derive(serde::Serialize)]
struct GitMessageNode {
    node_type: String,
    value: String,
    issue_id: Option<String>,
    // children: Option<&'a GitMessageNode<'a>>,
}

#[derive(serde::Serialize)]
struct GitResponse {
    path: String,
    commits: Vec<GitCommit>,
}

#[derive(serde::Serialize)]
struct GitCommit {
    oid: String,
    author: GitAuthor,
    message: String,
    parsed_title: Vec<GitMessageNode>,
    parent_count: usize,
}

#[derive(serde::Serialize)]
struct GitAuthor {
    name: String,
    email: String,
}

#[tauri::command]
fn parse_git(path: &str) -> Result<GitResponse, String> {
    match internal_parse_git(path) {
        Ok(resp) => Ok(resp),
        Err(e) => Err(e.to_string()),
    }
}

fn internal_git_refs_hash(path: &str) -> Result<String, git2::Error> {
    let repo = git2::Repository::open(path)?;
    let mut reference_iterator = repo.references()?;

    let mut oid_string = String::new();
    while let Some(reference) = reference_iterator.next() {
        let reference = reference?;

        // Get the OID of the reference and add it to the string
        let maybe_oid = reference.target();
        if let Some(oid) = maybe_oid {
            oid_string.push_str(&oid.to_string());
        }
    }

    // Hash the concatenated OID string using the TwoX-Hash algorithm
    let hash = twox_hash::xxh3::hash128(oid_string.as_bytes());

    Ok(hash.to_string())
}

#[tauri::command]
fn git_refs_hash(path: &str) -> Result<String, String> {
    match internal_git_refs_hash(path) {
        Ok(resp) => Ok(resp),
        Err(e) => Err(e.to_string()),
    }
}

#[tauri::command]
async fn get_work_item(
    access_token: String,
    org: String,
    id: String,
    project: String,
) -> Result<azure_devops_rust_api::wit::models::WorkItem, String> {
    println!("{}, {}, {}, {}", access_token, org, id, project);

    // Get authentication credential
    let credential = azure_devops_rust_api::Credential::from_pat(access_token);

    let wit_client = azure_devops_rust_api::wit::ClientBuilder::new(credential).build();

    let work_item_id: i32 = id.parse().unwrap();
    let work_item = wit_client
        .work_items_client()
        .get_work_item(org, work_item_id, project)
        .expand("All")
        .await
        .unwrap();
    println!("Work item [{work_item_id}]:\n{:#?}", work_item);
    Ok(work_item)
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![parse_git, git_refs_hash, get_work_item])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
