const readline = require('readline');

const rl = readline.createInterface({
	input: process.stdin,
	output: process.stdout
});

console.log('Ok, so you are creating a new project!');
rl.question('What will the GitHub repo name be (e.g. next-front-page)? ', (answer) => {
  console.log(`Creating a ${answer} folder...`);
  rl.close();
});