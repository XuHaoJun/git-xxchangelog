use std::ops::Range;

#[tauri::command]
pub fn parse_git(path: &str) -> Result<GitResponse, String> {
    match internal_parse_git(path) {
        Ok(resp) => Ok(resp),
        Err(e) => Err(e.to_string()),
    }
}

fn internal_parse_git(path: &str) -> Result<GitResponse, git2::Error> {
    let repo = git2::Repository::open(path)?;

    let branches: Vec<(git2::Branch, git2::BranchType)> = repo
        .branches(None)
        .unwrap()
        .into_iter()
        .map(|x| x.unwrap())
        .collect();

    let tag_names_binding = repo.tag_names(None).unwrap();
    let tags: Vec<InternalGitTag> = tag_names_binding
        .iter()
        .map(|x| {
            let tag_name = x.unwrap();
            let tag_ref = repo.find_reference(tag_name);
            let tag_oid = match tag_ref {
                Ok(x) => x.resolve().unwrap().target(),
                Err(_) => None,
            };
            return InternalGitTag {
                name: tag_name.clone(),
                oid: tag_oid,
            };
        })
        .collect();

    let mut revwalk = repo.revwalk()?;
    revwalk.push_head()?;
    revwalk.set_sorting(git2::Sort::TOPOLOGICAL)?;
    let mut commits: Vec<GitCommit> = vec![];

    let mut next_oid: Option<git2::Oid> = None;

    for maybe_oid in revwalk {
        let oid = maybe_oid?;
        let commit = repo.find_commit(oid)?;

        let author = commit.author();
        let message = commit.message().unwrap_or("");
        let parent_count = commit.parent_count();

        let lines: Vec<&str> = message.split("\n").collect();
        let title = lines[0];

        let next_oid_string: Option<String> = match next_oid {
            Some(v) => Some(v.to_string()),
            None => None,
        };

        let commit_branches: Vec<GitBranch> = branches
            .iter()
            .filter(|x| {
                return x.0.get().resolve().unwrap().target().unwrap() == oid;
            })
            .map(|x| GitBranch::from_git2_branch(&x.0, &x.1))
            .collect();

        let commit_tags: Vec<GitTag> = tags
            .iter()
            .filter(|x| match x.oid {
                Some(x_oid) => x_oid == oid,
                None => false,
            })
            .map(|x| GitTag::from_internal_git_tag(x))
            .collect();

        commits.push(GitCommit {
            oid: oid.to_string(),
            next_oid: next_oid_string,
            author: GitAuthor {
                name: author.name().unwrap_or("").to_string(),
                email: author.email().unwrap_or("").to_string(),
            },
            message: message.to_string(),
            parsed_title: parse_git_message(title),
            parent_count,
            branches: commit_branches,
            tags: commit_tags,
        });

        next_oid = Some(oid);
    }

    Ok(GitResponse {
        path: path.to_string(),
        commits,
        branches: branches
            .iter()
            .map(|(b, b_type)| GitBranch::from_git2_branch(b, b_type))
            .collect(),
        tags: tags
            .iter()
            .map(|x| GitTag::from_internal_git_tag(x))
            .collect(),
    })
}

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

#[derive(serde::Serialize)]
pub struct GitResponse {
    pub path: String,
    pub commits: Vec<GitCommit>,
    pub branches: Vec<GitBranch>,
    pub tags: Vec<GitTag>,
}

#[derive(serde::Serialize)]
pub struct GitCommit {
    pub oid: String,
    pub author: GitAuthor,
    pub message: String,
    pub parsed_title: Vec<GitMessageNode>,
    pub parent_count: usize,
    pub next_oid: Option<String>,
    pub branches: Vec<GitBranch>,
    pub tags: Vec<GitTag>,
}

#[derive(serde::Serialize)]
pub struct GitMessageNode {
    pub node_type: String,
    pub value: String,
    pub issue_id: Option<String>,
    // children: Option<&'a GitMessageNode<'a>>,
}

#[derive(serde::Serialize)]
pub struct GitAuthor {
    pub name: String,
    pub email: String,
}

struct GitMessageChunk {
    range: Range<usize>,
    node_type: String,
    issue_id: Option<String>,
}

#[derive(serde::Serialize)]
pub struct GitBranch {
    pub oid: String,
    pub name: String,
    pub branch_type: String,
}

impl GitBranch {
    pub fn from_git2_branch(b: &git2::Branch, b_type: &git2::BranchType) -> Self {
        Self {
            oid: b.get().resolve().unwrap().target().unwrap().to_string(),
            name: b.name().unwrap().unwrap().to_string(),
            branch_type: match b_type {
                git2::BranchType::Local => "local".to_string(),
                git2::BranchType::Remote => "remote".to_string(),
            },
        }
    }
}

struct InternalGitTag<'a> {
    oid: Option<git2::Oid>,
    name: &'a str,
}

#[derive(serde::Serialize)]
pub struct GitTag {
    pub oid: Option<String>,
    pub name: String,
}

impl GitTag {
    fn from_internal_git_tag(x: &InternalGitTag) -> Self {
        Self {
            oid: match x.oid {
                Some(x_oid) => Some(x_oid.to_string()),
                None => None,
            },
            name: x.name.to_string(),
        }
    }
}
