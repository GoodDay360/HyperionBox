import { existsSync } from 'fs';
import path, { dirname } from 'path';
import { fileURLToPath, pathToFileURL} from 'url'


import minimist from 'minimist';

const validOptions = ['source', 'method', 'url', 'search', 'page', 'output_dir'];

const rawArgs = process.argv.slice(2).join(' ');
const combinedArgs = rawArgs.match(/(?:[^\s"]+|"[^"]*")+/g);
const args = minimist(combinedArgs, {
  string: validOptions,
  default: validOptions.reduce((acc, option) => {
    acc[option] = '';
    return acc;
  }, {})
});

const options = {};
let invalid_option = false;

for (const key in args) {
  if (validOptions.includes(key)) {
    options[key] = args[key].replace(/^"(.*)"$/, '$1'); // Remove quotes if present
  } else if (key !== '_') {
    invalid_option = true;
    console.error(`Unknown argument: ${key}`);
  }
}


options.BASE_DIRECTORY = dirname(fileURLToPath(import.meta.url));
options.output_dir = options.output_dir || options.BASE_DIRECTORY;

if (invalid_option) {console.error("Try again using correct argument.")}
else if (!options.source) {console.error("Missing 'source' argument.");}
else{
  const source_path = pathToFileURL(path.join(options.BASE_DIRECTORY, options.source, 'main.js')).href;
  if (!existsSync(fileURLToPath(source_path))) {console.error("Source not exist!")}
  else{
    const { default: main } = await import(source_path);
    await main(options)
  }

}
