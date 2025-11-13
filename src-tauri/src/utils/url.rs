use regex::Regex;

pub fn normalize_base_url(url: &str) -> String {
    // Split into base and query
    let mut parts = url.splitn(2, '?');
    let base = parts.next().unwrap_or("");
    let query = parts.next();

    // Collapse multiple slashes in base path
    let re = Regex::new(r"/{2,}").unwrap();
    let cleaned_base = re.replace_all(base, "/");

    match query {
        Some(q) => format!("{}?{}", cleaned_base, q),
        None => cleaned_base.to_string(),
    }
}