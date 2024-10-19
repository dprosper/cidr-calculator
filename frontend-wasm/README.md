This is based on an example from: https://towardsdev.com/rust-and-react-a-guide-to-webassembly-0cf4e751da99

# Step 1: Install wasm-pack
cargo install wasm-pack

# Step 2: Add WebAssembly Target
rustup target add wasm32-unknown-unknown

# Step 3: Create a Library Crate
cargo new --lib frontend-wasm

# Step 4: Configure Cargo.toml
Add to `Cargo.toml`

```
[lib]
crate-type = ["cdylib", "rlib"]

[dependencies]
wasm-bindgen = "0.2"
```

# Step 5: Write Rust Code
Update `lib.rs` 

```
use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub fn compare_cidr_networks(left_cidr: &str, right_cidr: &str) -> bool {
    ....
}
```

# Step 6: Compile to WebAssembly
wasm-pack build --target web

# Step 7: In React App, Install the WebAssembly Package
npm install ../frontend-wasm/pkg

# Step 8: Add to React App

- Module import
```
import init from 'frontend-wasm';
import { compare_cidr_networks, get_cidr_details } from 'frontend-wasm';
```

- Initialize the wasm module and use the function imported. 

```
  useEffect(() => {
    // Initialize the wasm module
    init().then(() => console.log('WASM loaded'));
  }, []);

```

# Step 9: Start app

```
npm start
```