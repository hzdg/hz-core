const emojiTypes = require('@hzcore/gitmoji');
const atomPresetOpts = require('conventional-changelog-atom');

const parserOpts = {
  headerPattern: /^([^(\s]*)(?: \(([\w$./@\-* ]*)\))? (.*)$/,
};

function whatBump(commits) {
  let level = 2;
  let breakings = 0;
  let features = 0;

  for (const commit of commits) {
    for (const emojiType of emojiTypes) {
      if (emojiType.emoji === commit.emoji || emojiType.code === commit.emoji) {
        switch (emojiType.level) {
          case 0:
            breakings += 1;
            level = 0;
            break;
          case 1:
            features += 1;
            level = Math.min(level, 1);
            break;
        }
        break;
      }
    }
  }

  return {
    level,
    reason: `There are ${breakings} BREAKING CHANGES and ${features} features`,
  };
}

const writerOpts = {
  transform(commit) {
    if (!commit.emoji || typeof commit.emoji !== 'string') {
      return;
    }
    const maxLength = 72;
    commit.emoji = commit.emoji.substring(0, maxLength);
    if (typeof commit.hash === `string`) {
      commit.hash = commit.hash.substring(0, 7);
    }
    if (typeof commit.shortDesc === `string`) {
      commit.shortDesc = commit.shortDesc.substring(
        0,
        maxLength - commit.emoji.length,
      );
    }
    return commit;
  },
  groupBy: `scope`,
  commitGroupsSort: `emoji`,
  commitsSort: [`emoji`, `shortDesc`],
};

function presetOpts(cb) {
  atomPresetOpts((err, opts) => {
    if (err) return cb(err);
    cb(null, {
      ...opts,
      conventionalChangelog: {
        ...opts.conventionalChangelog,
        parserOpts: {...opts.conventionalChangelog.parserOpts, ...parserOpts},
        writerOpts: {...opts.conventionalChangelog.writerOpts, ...writerOpts},
      },
      recommendedBumpOpts: {
        ...opts.recommendedBumpOpts,
        parserOpts: {...opts.recommendedBumpOpts.parserOpts, ...parserOpts},
        whatBump,
      },
      parserOpts: {...opts.parserOpts, ...parserOpts},
      writerOpts: {...opts.writerOpts, ...writerOpts},
    });
  });
}

presetOpts.parserOpts = parserOpts;

module.exports = presetOpts;
