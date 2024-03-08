'use strict';
const Generator = require('yeoman-generator');
const chalk = require('chalk');
const yosay = require('yosay');
const fs = require('fs');
const path = require('path');
const { promisify } = require('util');

module.exports = class extends Generator {
  async prompting() {
    this.answers = await this.prompt([
      {
        type: 'input',
        name: 'projectName',
        message: 'Enter project name:',
        default: 'MyNewProject'
      },
      // {
      //   type: 'input',
      //   name: 'moduleName',
      //   message: 'Enter module name:',
      //   default: 'sample-ui'
      // }
    ]);
  }

  // async writing() {
  //   // Copy files from existing Angular project to destination directory
  //   this.fs.copy(
  //     this.templatePath('D:/Projects/sample_ui'),
  //     this.destinationPath(this.answers.projectName),
  //     {
  //       globOptions: { dot: true }
  //     }
  //   );

  //   // Update package.json with new project name
  //   const packageJsonPath = this.destinationPath(`${this.answers.projectName}/package.json`);
  //   let packageJson = this.fs.readJSON(packageJsonPath);
  //   packageJson.name = this.answers.projectName;
  //   this.fs.writeJSON(packageJsonPath, packageJson);

  //   // Update angular.json with new project name and source root
  //   const angularJsonPath = this.destinationPath(`${this.answers.projectName}/angular.json`);
  //   let angularJson = this.fs.readJSON(angularJsonPath);
  //   for (const [, project] of Object.entries(angularJson.projects)) {
  //     project.root = '';
  //     project.sourceRoot = `${this.answers.projectName}/src`;
  //   }
  //   this.fs.writeJSON(angularJsonPath, angularJson);

  //   // Replace occurrences of the old project name with the new project name
  //   await this._replaceInFiles(
  //     this.destinationPath(this.answers.projectName),
  //     'sample_ui', // Replace with your old project name
  //     this.answers.projectName
  //   );
  // }

  // async _replaceInFiles(directory, searchValue, replaceValue) {
  //   const readdir = promisify(fs.readdir);
  //   const stat = promisify(fs.stat);
  //   const readFile = promisify(fs.readFile);
  //   const writeFile = promisify(fs.writeFile);

  //   const files = await readdir(directory);
  //   for (const file of files) {
  //     const filePath = path.join(directory, file);
  //     const fileStat = await stat(filePath);
  //     if (fileStat.isDirectory()) {
  //       await this._replaceInFiles(filePath, searchValue, replaceValue);
  //     } else if (fileStat.isFile()) {
  //       let content = await readFile(filePath, 'utf8');
  //       content = content.replace(new RegExp(searchValue, 'g'), replaceValue);
  //       await writeFile(filePath, content);
  //     }
  //   }
  // }

  async writing() {
    // Create project directory with the specified name
    const projectDir = this.answers.projectName;
    this.destinationRoot(projectDir);
    
    // Copy files from existing Angular project to destination directory
    this.fs.copy(
      this.templatePath('D:/Projects/sample_ui'),
      this.destinationPath(this.answers.projectName),
      {
        globOptions: { dot: true }
      }
    );
    
    // Update package.json with new project name
    const packageJsonPath = this.destinationPath(`${this.answers.projectName}/package.json`);
    let packageJson = this.fs.readJSON(packageJsonPath);
    packageJson.name = this.answers.projectName;
    this.fs.writeJSON(packageJsonPath, packageJson);

    // Update angular.json with new project name and source root
    const angularJsonPath = this.destinationPath(`${this.answers.projectName}/angular.json`);
    let angularJson = this.fs.readJSON(angularJsonPath);
    for (const [projectName, project] of Object.entries(angularJson.projects)) {
      if (projectName === 'sample_ui') { // Replace 'sample_ui' with your old project name
        const newProjectName = this.answers.projectName;
        project.sourceRoot = `src`;

        // Update all occurrences of the old project name with the new project name
        angularJson.projects[newProjectName] = project;
        delete angularJson.projects[projectName];
      }
    }

    for (const [, project] of Object.entries(angularJson.projects)) {
      project.root = '';
      project.sourceRoot = `src`;

      // Update all occurrences of the old project name with the new project name
      for (const [key, value] of Object.entries(project.architect)) {
        if (value.builder) {
          value.builder = value.builder.replace(/sample_ui/g, this.answers.projectName);
        }
        if (value.options) {
          for (const [optKey, optValue] of Object.entries(value.options)) {
            if (typeof optValue === 'string') {
              value.options[optKey] = optValue.replace(/sample_ui/g, this.answers.projectName);
            }
          }
        }
      }

      // Additional logic to handle the 'serve' section
      if (project.architect && project.architect.serve && project.architect.serve.configurations) {
        for (const [configKey, configValue] of Object.entries(project.architect.serve.configurations)) {
          if (configValue && configValue.buildTarget) {
            configValue.buildTarget = configValue.buildTarget.replace(/sample_ui/g, this.answers.projectName);
          }
        }
      }
    }
    this.fs.writeJSON(angularJsonPath, angularJson);
    
    // const projectPath = this.destinationPath('src','app');
    // console.log("projectPath",projectPath);
    // await this._replaceModuleName(projectPath, 'sampleui', this.answers.moduleName);
    
  }
  async _replaceModuleName(directory, searchValue, replaceValue) {
    const readdir = promisify(fs.readdir);
    const stat = promisify(fs.stat);
    const rename = promisify(fs.rename);
    const readFile = promisify(fs.readFile);
    const writeFile = promisify(fs.writeFile);

    const files = await readdir(directory);
    for (const file of files) {
      const filePath = path.join(directory, file);
      const fileStat = await stat(filePath);
      if (fileStat.isDirectory()) {
        const newDirectoryName = file.replace(new RegExp(searchValue, 'g'), replaceValue);
        const newDirectoryPath = path.join(directory, newDirectoryName);
        await rename(filePath, newDirectoryPath);
        await this._replaceModuleName(newDirectoryPath, searchValue, replaceValue);
      } else if (fileStat.isFile()) {
        const content = await readFile(filePath, 'utf8');
        const newContent = content.replace(new RegExp(searchValue, 'g'), replaceValue);
        await writeFile(filePath, newContent);
        if (file !== file.replace(new RegExp(searchValue, 'g'), replaceValue)) {
          const newFilePath = path.join(directory, file.replace(new RegExp(searchValue, 'g'), replaceValue));
          await rename(filePath, newFilePath);
        }
      }
    }
  }
  async install() {
   
    // Install dependencies if necessary
    // this.npmInstall();
  }
};
