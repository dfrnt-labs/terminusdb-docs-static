---
title: Install TerminusDB from Source Code
slug: install-terminusdb-from-source-code
seo:
  title: Install TerminusDB from Source Code
  description: Everything you need to install TerminusDB from source code.
  og_image: >-
    https://assets.terminusdb.com/docs/technical-documentation-terminuscms-og.png
media: []
---

## Install steps

Install, build and run TerminusDB from source code with the following steps.

*   [Install SWI-Prolog](#installswiprolog)
*   [Clone the TerminusDB repository](#clonetheterminusdbrepository)
*   [Make the TerminusDB Command Line Interface](#maketheterminusdbcommandlineinterface)
*   [Run the TerminusDB system database](#runtheterminusdbsystemdatabase)

> **Install from source code on Windows:**  
>   
> Install [WSL](https://ubuntu.com/wsl) and [Ubuntu](https://ubuntu.com/#download)  
>   
> In Ubuntu terminal: `sudo apt install make libgmp-dev`  
>   
> In Ubuntu terminal: `curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh`  
>   
> Follow the install steps below for **Debian or Ubuntu**

## Install SWI-Prolog, Rust and clang

### Linux

Install [Rust](https://www.rust-lang.org/tools/install) by following the Rust installation guide.

* * *

**Arch Linux**

Install all dependencies of all the required libraries using [sudo](https://www.sudo.ws/download.html) and [git](https://git-scm.com/downloads).

```
sudo pacman -S git swi-prolog make automake autoconf libtool zlib pkgconf gcc clang gmp
```

* * *

**Debian or Ubuntu**

Install using the apt package manager.

```
cat /etc/*release | grep ubuntu > /dev/null && (sudo apt-get install software-properties-common; sudo apt-add-repository ppa:swi-prolog/stable)
sudo apt-get update
sudo apt install swi-prolog clang libgmp-dev
```

* * *

**Fedora or Red Hat**

Install using [sudo](https://www.sudo.ws/download.html).

```
sudo dnf install pl pl-devel clang gmp-devel
```

### macOS

Install `swi-prolog` and `rust` using [homebrew](https://brew.sh).

```
brew install gmp
brew install swi-prolog
brew install rust
```

## Clone the TerminusDB repository

Identical for all operating systems: Clone the `terminusdb` repository from GitHub.

```
git clone https://github.com/terminusdb/terminusdb
```

## Make the TerminusDB Command Line Interface

`make` the `terminusdb` [Command Line Interface (CLI)](/docs/terminusdb-cli-commands/) binary.

### Linux

```
cd terminusdb
make install-tus
make
make install-dashboard
```

### macOS

```
cd  terminusdb
make install-tus
make
make install-dashboard
```

## Run the TerminusDB system database

### Linux

Initialize the system database and choose a password for the admin user.

*   Server starts on `http://127.0.0.1:6363`

```
./terminusdb store init --key "my_password_here"
./terminusdb serve
```

### macOS

*   Initialize the system database.
*   Server starts on `http://127.0.0.1:6363`

```
./terminusdb store init --key root
./terminusdb serve
```

## Further Reading

[**The TerminusDB Command Line Interface**](/docs/terminusdb-cli-commands/)