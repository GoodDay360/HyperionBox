[<img src="https://github.com/GoodDay360/HyperionBox/blob/main/public/1500x500-banner.png?raw=true">](https://github.com/GoodDay360/HyperionBox)
<div>
    <a href="https://discord.gg/TkArvnVvNG">
        <img src="https://dcbadge.limes.pink/api/server/TkArvnVvNG?style=flat" />
    </a>
    <a href="https://github.com/GoodDay360/HyperionBox/releases">
        <img src="https://img.shields.io/github/v/release/GoodDay360/HyperionBox" />
    </a>
    <a href="https://github.com/GoodDay360/HyperionBox/releases">
        <img src="https://img.shields.io/github/downloads/GoodDay360/HyperionBox/total?color=green" />
    </a>
    <a href="https://github.com/GoodDay360/HyperionBox">
        <img src="https://img.shields.io/badge/human-coded-purple?logo=data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiNmZmZmZmYiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIiBjbGFzcz0ibHVjaWRlIGx1Y2lkZS1wZXJzb24tc3RhbmRpbmctaWNvbiBsdWNpZGUtcGVyc29uLXN0YW5kaW5nIj48Y2lyY2xlIGN4PSIxMiIgY3k9IjUiIHI9IjEiLz48cGF0aCBkPSJtOSAyMCAzLTYgMyA2Ii8+PHBhdGggZD0ibTYgOCA2IDIgNi0yIi8+PHBhdGggZD0iTTEyIDEwdjQiLz48L3N2Zz4=" />
    </a>
    <a href="https://deepwiki.com/GoodDay360/HyperionBox">
        <img src="https://deepwiki.com/badge.svg" />
    </a>
    <a href="https://github.com/GoodDay360/HyperionBox">
        <img src="https://img.shields.io/github/stars/GoodDay360/HyperionBox" />
    </a>
    
</div>

# Download

### <img src="https://upload.wikimedia.org/wikipedia/commons/5/5f/Windows_logo_-_2012.svg" alt="Android" width="20" height="20"> Windows, <img src="https://upload.wikimedia.org/wikipedia/commons/d/d7/Android_robot.svg" alt="Android" width="20" height="20"> Android, <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/3/35/Tux.svg/759px-Tux.svg.png?20220320193426" alt="Android" width="20" height="20"> Linux
[![Download](https://img.shields.io/badge/Download-GitHub-blue?style=for-the-badge&logo=github)](https://github.com/GoodDay360/HyperionBox/releases/latest)

### <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/3/35/Tux.svg/759px-Tux.svg.png?20220320193426" alt="Android" width="20" height="20"> Linux Snap Store 
Delayed release and laggy due to the sandbox

[![Get it from the Snap Store](https://snapcraft.io/en/dark/install.svg)](https://snapcraft.io/hyperionbox)


# What's HyperionBox?
An open-source anime and movie streaming app that supports many sources through plugins.

# ✨ Features
- 🎬 **Stream anime and movies** seamlessly from various sources.
- 📌 **Track your watch progress** and pick up where you left off.
- ☁️ **Integrate with [HyperSync](https://github.com/GoodDay360/HyperSync)** to sync your favorites and watch history across all your devices.
- ⬇️ **Download** for offline watching.
- 🎨 **Modern UI** for a smooth and intuitive experience.
- 🔍 **Advanced search** for quick content discovery.
- 🧩 **Plugins**: check source code in this repository [chlaty-core](https://github.com/chlaty/chlaty-core).

# How it works?
- Instead of spawning a local server like other apps, we uses [chlaty-core](https://github.com/chlaty/chlaty-core) to fetch available streaming sources from different plugins, and leverages [IPC](https://v2.tauri.app/concept/inter-process-communication/) to manage streaming logic in Rust and pass it to the video player.
- Plugins are built-in, so there is no need for manual installation.
- By using this method, when a plugin is updated, HyperionBox does not need to update the entire application; only the new plugin needs to be updated.
- HyperionBox can be compiled and used on almost every platform supported by Tauri, with minimal software limitations.

# Stack

- [Rust](https://www.rust-lang.org/pt-BR)
  - [Tauri](https://v2.tauri.app/)
    <details>
      <summary>Tauri Official Plugins</summary>
          <ul>
            <li><a href="https://v2.tauri.app/plugin/sql/">@tauri-apps/plugin-sql</a></li>
            <li><a href="https://v2.tauri.app/plugin/http/">@tauri-apps/plugin-http</a></li>
            <li><a href="https://v2.tauri.app/plugin/file-system/">@tauri-apps/plugin-fs</a></li>
            <li><a href="https://v2.tauri.app/plugin/updater/">@tauri-apps/plugin-updater</a></li>
            <li><a href="https://v2.tauri.app/plugin/single-instance/">@tauri-apps/plugin-single-instance</a></li>
            <li><a href="https://v2.tauri.app/plugin/opener/">@tauri-apps/plugin-opener</a></li>
            <li><a href="https://v2.tauri.app/plugin/os-info/">@tauri-apps/plugin-os</a></li>
          </ul>
    </details>
  - [@CrossCopy/tauri-plugin-clipboard](https://github.com/CrossCopy/tauri-plugin-clipboard)
- [Typescript](https://www.typescriptlang.org/)
- [SolidJS](https://www.solidjs.com/)
- [Bootstrap](https://getbootstrap.com/)


# 📸 Screenshot
### Home
<img width="1920" height="1080" alt="Screenshot (551)" src="https://github.com/user-attachments/assets/a8f41e0e-1430-4243-89e1-727f556abf2a" />

### View
<img width="1920" height="1080" alt="Screenshot (552)" src="https://github.com/user-attachments/assets/b6455082-1b4c-48ec-958b-26d0270fd468" />

### Search
<img width="1920" height="1080" alt="Screenshot (553)" src="https://github.com/user-attachments/assets/f926264a-b776-4c39-b77b-959382ce91ff" />

### Download
<img width="1920" height="1080" alt="Screenshot (554)" src="https://github.com/user-attachments/assets/fb96d09d-dec6-4099-89f4-f1dbaa401cfd" />


### Watch
<img width="1920" height="1080" alt="Screenshot (555)" src="https://github.com/user-attachments/assets/9f8c7c83-2682-4ff6-9dc7-abc7461e578c" />

# Contribution Guide

## Prerequisites

This project is built with [Tauri](https://v2.tauri.app/start/prerequisites/).  
Make sure you have installed all required prerequisites for your operating system.

## Package Manager & Frameworks

I use [Bun](https://bun.sh/) for package management. While Bun doesn’t directly affect how the app runs (since Tauri handles rendering), I prefer it for convenience. You’re free to use another package manager, but please avoid committing changes that are only needed for your local setup.  

The application itself is developed with **SolidJS** for the frontend and  css reset from **Bootstrap**, all running inside Tauri.

## Setup

Install the dependencies:

```bash
bun install
```

### Start a development

```bash
bun tauri dev
```
### Production

Build the application for production:

```bash
bun tauri build
```
