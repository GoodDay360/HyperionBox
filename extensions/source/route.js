import { existsSync } from 'fs';
import path, { dirname } from 'path';
import { fileURLToPath, pathToFileURL} from 'url'


const args = process.argv.slice(2);
const options = {};
// Loop through the arguments
for (let i = 0; i < args.length; i++) {
  switch(args[i]) {
    case '--source':
      options.source = args[i + 1];
      i++;
      break;
    case '--method':
        options.method = args[i + 1];
        i++;
        break;
    case '--url':
      options.url = args[i + 1];
      i++;
      break;
    default:
      console.log(`Unknown argument: ${args[i]}`);
  }
}

if (!options.source) {console.error("Missing 'source' argument");}
else{
  const __base_directory = dirname(fileURLToPath(import.meta.url));
  const source_path = pathToFileURL(path.join(__base_directory, options.source, 'main.js')).href;

  if (!existsSync(fileURLToPath(source_path))) {console.error("Source not exist!")}
  else{
    const { default: main } = await import(source_path);
    await main(options)
  }

}
