/* eslint-env jest, node */
import {promisify} from 'util';
import fs from 'fs';
import path from 'path';
import childProcess from 'child_process';

const exec = promisify(childProcess.exec);
const readFile = promisify(fs.readFile);

interface Pkg {
  name: string;
  version: string;
  private: boolean;
  location: string;
}

if (typeof process.env.PACKAGE_INSTALL_PATH !== 'string') {
  throw new Error('Missing PACKAGE_INSTALL_PATH env var!');
}

if (typeof process.env.PACKAGES_TO_TEST !== 'string') {
  throw new Error('Missing PACKAGES_TO_TEST env var!');
}

const pkgInstallPath = JSON.parse(process.env.PACKAGE_INSTALL_PATH).toString();

const pkgsToTest: Pkg[] = JSON.parse(process.env.PACKAGES_TO_TEST);

describe.each(pkgsToTest.map<[string, Pkg]>(pkg => [pkg.name, pkg]))(
  `%s`,
  (_, pkg) => {
    test(`has been installed as version ${pkg.version}`, async () => {
      const meta = JSON.parse(
        (await readFile(
          path.resolve(
            pkgInstallPath,
            'node_modules',
            pkg.name,
            'package.json',
          ),
        )).toString(),
      );
      expect(meta.name).toBe(pkg.name);
      expect(meta.version).toBe(pkg.version);
    });

    test(`can be used as a module`, async () => {
      const {stdout, stderr} = await exec(
        `node -p -e "require('${pkg.name}')"`,
        {
          cwd: pkgInstallPath,
          env: {
            NODE_PATH: path.resolve(pkgInstallPath, 'node_modules'),
          },
        },
      );
      expect(stdout).not.toMatch(/^\s*$/);
      expect(stdout).not.toMatch(/^\s*{}\s*$/);
      expect(stderr).toBe('');
    });
  },
);
