const fs = require("fs");
const replace = require("replace-in-file");
const mkdirp = require("mkdirp");

const CWD = process.cwd();
const DIR = `${CWD}/dist`;

// const data = JSON.parse(fs.readFileSync(`${CWD}/data/people.json`));

// async function generateFile({ label, name, url, topEmotion, topEmotionPercent, pronoun, opening, openingStart }) {
//   const slug = name.replace(" ", "-").replace(" ", "-").replace(" ", "-");
//   console.log(slug);
//   const filepath = `${DIR}/${slug}.html`;
//   fs.copyFileSync(`${DIR}/index.html`, filepath);
//   try {
//     await replace({
//       files: filepath,
//       from: [/\*label\*/g, /\*name\*/g, /\*url\*/g, /\*top-emotion\*/g, /\*top-emotion-percent\*/g, /\*pronoun\*/g, /\*opening\*/g, /\*openingStart\*/g, /\*slug\*/g],
//       to: [label, name, url, topEmotion, topEmotionPercent, pronoun, opening, openingStart, slug]
//     });
//     return Promise.resolve();
//   } catch (error) {
//     return Promise.reject(error);
//   }
// }
//
async function createEmbed() {
  const filepath = `${DIR}/embed.html`;
  fs.copyFileSync(`${DIR}/index.html`, filepath);
  try {
    await replace({
      files: filepath,
      from: [/\*embed\*/g],
      to: ["embed"]
    });
    return Promise.resolve();
  } catch (error) {
    return Promise.reject(error);
  }
}


async function init() {
  // console.time("generating people pages");
  // for (let d of data) {
  //   try {
  //     await generateFile(d);
  //   } catch (err) {
  //     console.log(err);
  //     process.exit(1);
  //   }
  // }

  createEmbed()

  await replace({
    files: `${DIR}/index.html`,
    from: [/\*embed\*/g],
    to: ["full-story"]
  });

}

init();
