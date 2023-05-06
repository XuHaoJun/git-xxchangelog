#[tauri::command]
pub async fn azure_get_work_item(
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
