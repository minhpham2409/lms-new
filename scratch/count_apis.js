const fs = require('fs');
const path = require('path');

function getFiles(dir, filter) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) {
            results = results.concat(getFiles(file, filter));
        } else if (file.endsWith(filter)) {
            results.push(file);
        }
    });
    return results;
}

// 1. Count Backend APIs
const controllers = getFiles(path.join(__dirname, '../backend/src'), '.controller.ts');
let backendApisCount = 0;
const methodRegex = /@(Get|Post|Put|Patch|Delete)\(/g;

controllers.forEach(file => {
    const content = fs.readFileSync(file, 'utf8');
    const matches = content.match(methodRegex);
    if (matches) {
        backendApisCount += matches.length;
    }
});

console.log(`Backend APIs: ${backendApisCount}`);

// 2. Count Frontend APIs
const apiFilePath = path.join(__dirname, '../frontend/lib/api.ts');
const apiContent = fs.readFileSync(apiFilePath, 'utf8');

// Find all properties in objects exported like: `key: (args) => fetch(`
const fetchRegex = /fetch\(/g;
const frontendApisCount = (apiContent.match(fetchRegex) || []).length;

console.log(`Frontend APIs connected: ${frontendApisCount}`);
