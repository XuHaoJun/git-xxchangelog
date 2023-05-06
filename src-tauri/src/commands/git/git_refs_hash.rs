#[tauri::command]
pub fn git_refs_hash(path: &str) -> Result<String, String> {
    match internal_git_refs_hash(path) {
        Ok(resp) => Ok(resp),
        Err(e) => Err(e.to_string()),
    }
}

fn internal_git_refs_hash(path: &str) -> Result<String, git2::Error> {
    let repo = git2::Repository::open(path)?;
    let mut reference_iterator = repo.references()?;

    let mut oids_string = String::new();
    while let Some(reference) = reference_iterator.next() {
        let reference = reference?;
        if reference.is_remote() {
            continue;
        }

        // Get the OID of the reference and add it to the string
        let maybe_oid = reference.target();
        if let Some(oid) = maybe_oid {
            oids_string.push_str(&oid.to_string());
        }
    }

    // Hash the concatenated OID string using the TwoX-Hash algorithm
    let hash = twox_hash::xxh3::hash128(oids_string.as_bytes());

    Ok(format!("{:x}", hash))
}
