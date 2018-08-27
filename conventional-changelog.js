// const atomPresetOpts = require('conventional-changelog-atom');
const emojiTypes = require('./cz-emoji-types.json');

const parserOpts = {
  headerPattern: /^([^(\s]*)(?: \(([\w$./@\-* ]*)\))? (.*)$/,
  headerCorrespondence: ['emoji', 'scope', 'shortDesc'],
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



const mainTemplate = `{{> header}}

{{#each commitGroups}}

{{#if title}}
### {{title}}

{{/if}}
{{#each commits}}
{{> commit root=@root}}
{{/each}}
{{/each}}
`;

const headerPartial = `{{#if isPatch}}##{{else}}#{{/if}} {{#if @root.linkCompare}}[{{version}}]({{@root.host}}/{{#if @root.owner}}{{@root.owner}}/{{/if}}{{@root.repository}}/compare/{{previousTag}}...{{currentTag}}){{else}}{{version}}{{/if}}{{#if title}} "{{title}}"{{/if}}{{#if date}} ({{date}}){{/if}}
`;

const commitPartial = `* {{#if shortDesc}}{{shortDesc}}{{else}}{{header}}{{/if}}

{{~!-- commit hash --}} {{#if @root.linkReferences}}([{{hash}}]({{#if @root.host}}{{@root.host}}/{{/if}}{{#if @root.owner}}{{@root.owner}}/{{/if}}{{@root.repository}}/{{@root.commit}}/{{hash}})){{else}}{{hash~}}{{/if}}

{{~!-- commit references --}}{{#if references}}, closes{{~#each references}} {{#if @root.linkReferences}}[{{#if this.owner}}{{this.owner}}/{{/if}}{{this.repository}}#{{this.issue}}]({{#if @root.host}}{{@root.host}}/{{/if}}{{#if this.repository}}{{#if this.owner}}{{this.owner}}/{{/if}}{{this.repository}}{{else}}{{#if @root.owner}}{{@root.owner}}/{{/if}}{{@root.repository}}{{/if}}/{{@root.issue}}/{{this.issue}}){{else}}{{#if this.owner}}{{this.owner}}/{{/if}}{{this.repository}}#{{this.issue}}{{/if}}{{/each}}{{/if}}`;

const writerOpts = {
  mainTemplate,
  headerPartial,
  commitPartial,
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

module.exports = {
  conventionalChangelog: {parserOpts, writerOpts},
  recommendedBumpOpts: {parserOpts, whatBump},
  parserOpts,
  writerOpts,
};

// module.exports = function presetOpts(cb) {
//   atomPresetOpts((err, opts) => {
//     if (err) return cb(err);
//     cb(null, {
//       conventionalChangelog: {parserOpts, writerOpts},
//       recommendedBumpOpts: {parserOpts, whatBump},
//       parserOpts,
//       writerOpts,
//     });
//   //   cb(null, {
//   //     ...opts,
//   //     conventionalChangelog: {
//   //       ...opts.conventionalChangelog,
//   //       parserOpts: {...opts.conventionalChangelog.parserOpts, ...parserOpts},
//   //       writerOpts: {...opts.conventionalChangelog.writerOpts, ...writerOpts},
//   //     },
//   //     recommendedBumpOpts: {
//   //       ...opts.recommendedBumpOpts,
//   //       parserOpts: {...opts.recommendedBumpOpts.parserOpts, ...parserOpts},
//   //       whatBump,
//   //     },
//   //     parserOpts: {...opts.parserOpts, ...parserOpts},
//   //     writerOpts: {...opts.writerOpts, ...writerOpts},
//   //   });
//   });
// };

//
// module.exports = {
//   conventionalChangelog: {parserOpts, writerOpts},
//   recommendedBumpOpts: {parserOpts, whatBump},
//   parserOpts,
//   writerOpts,
// };
