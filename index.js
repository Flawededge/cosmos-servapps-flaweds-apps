const fs = require('fs');
const path = require('path');
const configFile = require('./config.json');

const servappsPath = './servapps';
const sourceRoot = configFile.url.replace(/\/[^/]*$/, '');
const localRoot = 'http://localhost:3000';
const catalogVersion = 'homebridge-20260601-0310-caddy-command-adminonly';

function listFilesIfPresent(dir) {
  if (!fs.existsSync(dir)) {
    return [];
  }

  return fs.readdirSync(dir).filter((file) => fs.lstatSync(path.join(dir, file)).isFile());
}

const servapps = fs
  .readdirSync(servappsPath)
  .filter((file) => fs.lstatSync(path.join(servappsPath, file)).isDirectory());

const servappsJSON = [];

for (const file of servapps) {
  const appPath = path.join(servappsPath, file);
  const servapp = require(`./${path.join(appPath, 'description.json')}`);

  servapp.id = file;
  servapp.screenshots = [];
  servapp.artefacts = {};

  for (const screenshot of listFilesIfPresent(path.join(appPath, 'screenshots'))) {
    servapp.screenshots.push(`${sourceRoot}/servapps/${file}/screenshots/${screenshot}`);
  }

  for (const artefact of listFilesIfPresent(path.join(appPath, 'artefacts'))) {
    servapp.artefacts[artefact] = `${sourceRoot}/servapps/${file}/artefacts/${artefact}`;
  }

  servapp.icon = `${sourceRoot}/servapps/${file}/icon.png`;

  if (fs.existsSync(path.join(appPath, 'docker-compose.yml'))) {
    servapp.compose = `${sourceRoot}/servapps/${file}/docker-compose.yml`;
  }

  if (fs.existsSync(path.join(appPath, 'cosmos-compose.json'))) {
    servapp.compose = `${sourceRoot}/servapps/${file}/cosmos-compose.json?v=${catalogVersion}`;
  }

  servappsJSON.push(servapp);
}

const showcaseNames = ['Homebridge'];
const showcases = servappsJSON.filter((app) => showcaseNames.includes(app.name));

const apps = {
  source: configFile.url,
  showcase: showcases,
  all: servappsJSON
};

fs.writeFileSync('./servapps.json', JSON.stringify(servappsJSON, null, 2));
fs.writeFileSync('./index.json', JSON.stringify(apps, null, 2));

for (const servapp of servappsJSON) {
  servapp.compose = `${localRoot}/servapps/${servapp.id}/cosmos-compose.json`;
  servapp.icon = `${localRoot}/servapps/${servapp.id}/icon.png`;
  servapp.screenshots = servapp.screenshots.map((screenshot) => screenshot.replace(sourceRoot, localRoot));

  for (const artefact in servapp.artefacts) {
    servapp.artefacts[artefact] = servapp.artefacts[artefact].replace(sourceRoot, localRoot);
  }
}

fs.writeFileSync('./servapps_test.json', JSON.stringify(apps, null, 2));
