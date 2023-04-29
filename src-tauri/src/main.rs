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

fn internal_print_git(path: &str) -> Result<(), git2::Error> {
    let repo = git2::Repository::open(path)?;

    let mut revwalk = repo.revwalk()?;
    revwalk.push_head()?;
    revwalk.set_sorting(git2::Sort::TIME)?;

    Ok(for maybe_oid in revwalk.take(10) {
        let oid = maybe_oid?;
        let commit = repo.find_commit(oid)?;

        let author = commit.author();
        let message = commit.message().unwrap_or("<no message>");

        println!(
            "{} by {} - {}",
            oid,
            author.name().unwrap_or("<no author>"),
            message
        );
    })
}

#[tauri::command]
fn print_git(path: &str) {
    let _ = internal_print_git(path);
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![greet])
        .invoke_handler(tauri::generate_handler![print_git])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
