# sumjs

A futuristic CLI for building React + Sumjs apps.

## Installation

1. Build your React application.
2. Move the assets to the Sumjs resources folder.
3. Build the Sumjs binary.

## Project Structure
const output = await Sumjs.os.execCommand("echo 'Hello World'");
console.log(output.stdOut);
```

### 2. Filesystem (`Sumjs.filesystem`)
Read and write files on the user's system.

```typescript
// Write a file
await Sumjs.filesystem.writeFile("./my-file.txt", "Hello Sumjs!");

// Read a file
const content = await Sumjs.filesystem.readFile("./my-file.txt");
console.log(content);

// Create a directory
await Sumjs.filesystem.createDirectory("./data");
```

### 3. Window Management (`Sumjs.window`)
Control the application window.

```typescript
// Minimize window
await Sumjs.window.minimize();

// Toggle fullscreen
if (await Sumjs.window.isFullScreen()) {
    await Sumjs.window.exitFullScreen();
} else {
    await Sumjs.window.setFullScreen();
}
```

### 4. Computer Info (`Sumjs.computer`)
Get system hardware information.

```typescript
const ram = await Sumjs.computer.getMemoryInfo();
console.log(`Total RAM: ${ram.physical.total} bytes`);
```

## Using in React Components

Since `Sumjs` is asynchronous, it's best to use it inside `useEffect` or event handlers.

```tsx
import { useState } from 'react';

function SystemInfo() {
  const [osInfo, setOsInfo] = useState<string>('');

  const fetchInfo = async () => {
    try {
      const info = await Sumjs.computer.getOSInfo();
      setOsInfo(`${info.name} ${info.version}`);
    } catch (err) {
      console.error("Sumjs API Error:", err);
    }
  };

  return (
    <div>
      <h2>System Info</h2>
      <p>{osInfo}</p>
      <button onClick={fetchInfo}>Get OS Info</button>
    </div>
  );
}
```

## Extensions (Advanced Backend)

If you need to run heavy backend logic (Python, Node.js, Go, etc.) that isn't covered by the native API, you can use **Extensions**.

1.  Create a folder in `extensions/`.
2.  Add your backend script (e.g., `server.py`).
3.  Configure it in `sum.config.json`.
4.  Communicate using `Sumjs.extensions.dispatch` and `Sumjs.events.on`.
# sumjs-cli
