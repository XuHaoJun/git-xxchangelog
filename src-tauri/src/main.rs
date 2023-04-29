// Prevents additional console window on Windows in release
#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

// Learn more about Tauri commands at https://tauri.app/v1/guides/features/command
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

fn internal_print_git(path: &str) -> Result<GitResponse, git2::Error> {
    let repo = git2::Repository::open(path)?;

    let mut revwalk = repo.revwalk()?;
    revwalk.push_head()?;
    revwalk.set_sorting(git2::Sort::TIME)?;
    let mut commits: Vec<GitCommit> = vec![];

    for maybe_oid in revwalk.take(10) {
        let oid = maybe_oid?;
        let commit = repo.find_commit(oid)?;

        let author = commit.author();
        let message = commit.message().unwrap_or("");

        commits.push(GitCommit {
            oid: oid.to_string(),
            author: GitAuthor {
                name: author.name().unwrap_or("").to_string(),
                email: author.email().unwrap_or("").to_string(),
            },
            message: message.to_string(),
        });
    }

    Ok(GitResponse { commits })
}

#[derive(serde::Serialize)]
struct GitResponse {
    commits: Vec<GitCommit>,
}

#[derive(serde::Serialize)]
struct GitCommit {
    oid: String,
    author: GitAuthor,
    message: String,
}

#[derive(serde::Serialize)]
struct GitAuthor {
    name: String,
    email: String,
}

#[tauri::command]
fn print_git(path: &str) -> Result<GitResponse, String> {
    match internal_print_git(path) {
        Ok(resp) => Ok(resp),
        Err(e) => Err(e.to_string()),
    }
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![greet])
        .invoke_handler(tauri::generate_handler![print_git])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
