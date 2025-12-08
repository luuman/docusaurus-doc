# 环境搭建

## MacOS

### Xcode

```bash
xcode-select --install
# Xcode 提供 macOS 开发所需的编译工具。
```

### Node.js

建议使用 nvm（Node 版本管理工具）来管理 Node.js 版本。

```bash
# 安装 nvm：
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.35.2/install.sh | bash

# 安装 Node.js 并使用最新版本：
nvm install node --latest-npm
nvm use node

# Expected version "^18.0.0 || >=20.0.0". Got "16.15.0"
```

```bash
# 推荐安装 Yarn：
# Yarn 是更高效的包管理工具，替代 npm。
npm install -g yarn
```

### Rust

```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
# Tauri 的后端使用 Rust，需要安装 Rust 编译工具链。
# 安装 rustup（Rust 安装管理工具）：
```

```bash
info: downloading installer

Welcome to Rust!

This will download and install the official compiler for the Rust
programming language, and its package manager, Cargo.

Rustup metadata and toolchains will be installed into the Rustup
home directory, located at:

  /Users/soaringmini/.rustup

This can be modified with the RUSTUP_HOME environment variable.

The Cargo home directory is located at:

  /Users/soaringmini/.cargo

This can be modified with the CARGO_HOME environment variable.

The cargo, rustc, rustup and other commands will be added to
Cargo's bin directory, located at:

  /Users/soaringmini/.cargo/bin

This path will then be added to your PATH environment variable by
modifying the profile files located at:

  /Users/soaringmini/.profile
  /Users/soaringmini/.bash_profile
  /Users/soaringmini/.zshenv

You can uninstall at any time with rustup self uninstall and
these changes will be reverted.

Current installation options:


   default host triple: aarch64-apple-darwin
     default toolchain: stable (default)
               profile: default
  modify PATH variable: yes

1) Proceed with standard installation (default - just press enter)
2) Customize installation
3) Cancel installation
>

info: profile set to 'default'
info: default host triple is aarch64-apple-darwin
info: syncing channel updates for 'stable-aarch64-apple-darwin'


info: latest update on 2024-11-28, rust version 1.83.0 (90b35a623 2024-11-26)
info: downloading component 'cargo'
info: downloading component 'clippy'
info: downloading component 'rust-docs'
 10.7 MiB /  16.5 MiB ( 65 %)   0 B/s in  1s ETA: Unknown
 16.5 MiB /  16.5 MiB (100 %)  10.7 MiB/s in  1s ETA:  0s
info: downloading component 'rust-std'

 25.7 MiB /  25.7 MiB (100 %)  10.4 MiB/s in  2s ETA:  0s
info: downloading component 'rustc'
 53.1 MiB /  53.1 MiB (100 %)  10.1 MiB/s in  5s ETA:  0s
info: downloading component 'rustfmt'
info: installing component 'cargo'
info: installing component 'clippy'
info: installing component 'rust-docs'
 16.5 MiB /  16.5 MiB (100 %)   5.3 MiB/s in  3s ETA:  0s
info: installing component 'rust-std'
 25.7 MiB /  25.7 MiB (100 %)  17.4 MiB/s in  1s ETA:  0s
info: installing component 'rustc'
 53.1 MiB /  53.1 MiB (100 %)  20.0 MiB/s in  2s ETA:  0s
info: installing component 'rustfmt'
info: default toolchain set to 'stable-aarch64-apple-darwin'

  stable-aarch64-apple-darwin installed - rustc 1.83.0 (90b35a623 2024-11-26)


Rust is installed now. Great!

To get started you may need to restart your current shell.
This would reload your PATH environment variable to include
Cargo's bin directory ($HOME/.cargo/bin).

To configure your current shell, you need to source
the corresponding env file under $HOME/.cargo.

This is usually done by running one of the following (note the leading DOT):
. "$HOME/.cargo/env"            # For sh/bash/zsh/ash/dash/pdksh
source "$HOME/.cargo/env.fish"  # For fish
```

```bash
# 验证 Rust 是否安装成功：
rustc --version

# 成功输出示例：
rustc 1.83.0 (90b35a623 2024-11-26)
```

> 小提示：

如果运行 `rustc` 命令失败，可以重启终端，再次尝试。

## Windows

### VisualStudio

安装 Build Tools for Visual Studio 2022 ，确保已勾选 C++ 构建工具 和 Windows 10 SDK。

### WebView2

注意：Windows 11 中已内置 WebView2
Tauri 严重依赖 WebView2 在 Windows 上呈现 Web 内容，因此必须安装 WebView2。最简单的方法是从 Microsoft Edge Developer 下载并运行 Evergreen Bootstrapper。 引导程序将尝试为你的系统确定正确的程序包及版本。注意：如果遇到问题（尤其是 ARM 上的 Windows），可以手动选择正确的安装程序。

### Rust

前往 rust-lang.org/tools/install 安装 rustup（Rust 安装程序）
