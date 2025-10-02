use chrono::Datelike;
use chrono::Utc;
use serde::{Deserialize, Serialize};

#[derive(Debug, Deserialize, Serialize, Clone)]
pub struct Calendar {
    pub anime_season: String,
    pub year: usize,
    pub month: usize,
    pub day: usize,
}

pub fn new() -> Result<Calendar, String> {
    let current_datetime = Utc::now();
    let year = current_datetime.year();
    let month = current_datetime.month();
    let day = current_datetime.day();

    let anime_season = match month {
        1..=3 => "winter",
        4..=6 => "spring",
        7..=9 => "summer",
        10..=12 => "fall",
        _ => "unknown",
    };

    Ok(Calendar {
        anime_season: anime_season.to_string(),
        year: year as usize,
        month: month as usize,
        day: day as usize,
    })
}
