use serde::{Deserialize, Serialize};

#[derive(Debug, Deserialize, Serialize, Clone)]
pub struct WatchState {
    pub current_time: Option<f64>,
}

impl WatchState {
    pub fn default() -> WatchState {
        WatchState { current_time: None }
    }
}
