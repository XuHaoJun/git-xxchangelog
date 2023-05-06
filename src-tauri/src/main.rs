// Prevents additional console window on Windows in release
#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

mod commands;

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            commands::git::parse_git::parse_git,
            commands::git::git_refs_hash::git_refs_hash,
            commands::azure::azure_get_work_item::azure_get_work_item,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
