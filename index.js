"use strict";
function init(modules) {
    // @ts-ignore
    const ts = modules.typescript;
    function create(info) {
        process.env.TSS_LOG = '-logToFile true -file ~/tslog -level verbose';
        const ls = info.languageService;
        const proxy = Object.assign({}, ls);
        // const logger = info.project.projectService.logger;
        proxy.getCompletionsAtPosition = (fileName, position, options) => {
            const prior = ls.getCompletionsAtPosition(fileName, position, options);
            if (!prior) {
                return;
            }
            prior.entries = prior.entries.map(e => {
                // todo
                const hypercodeLinks = findHypercodeLinksInString(e.name);
                if (hypercodeLinks.length) {
                    // todo
                    return Object.assign(e, { name: hypercodeLinks[0].identifier });
                }
                return e;
            });
            return prior;
        };
        return proxy;
    }
    return { create };
}
function humanToMachineName(name) {
    name = name.trim();
    // remove all long whitespaces
    while (true) {
        if (name === (name = name.replace('  ', ' ')))
            break;
    }
    return name
        .split(/ |-/)
        .map((word, index) => (word = word.split('').filter(isValidMachineNameChar).join(''))
        &&
            index === 0
        ? word
        : word[0].toUpperCase() + word.substring(1))
        .join('');
    function isValidMachineNameChar(char) {
        if (char === '_' || char === '$')
            return true;
        const charCode = char.charCodeAt(0);
        return charCode > 64 && charCode < 123;
    }
}
function findHypercodeLinksInString(str) {
    const results = [];
    for (let i = 0, state = { mode: 'outside', kind: '' }; i < str.length;) {
        if (state.mode === 'outside') {
            if (str[i] === '<') {
                if (str[i + 1] === '@') {
                    state = { mode: 'inside', kind: 'anchor', startPos: i };
                }
                else if (str[i + 1] === '#') {
                    state = { mode: 'inside', kind: 'link', startPos: i };
                }
                if (state.mode === 'inside') {
                    // increment once to skip '@' or '#' char
                    i++;
                }
            }
        }
        else {
            if (str[i] === '>') {
                results.push({
                    // below 2 is the length of `"<@"` or `"<#"`
                    identifier: humanToMachineName(str.substring(state.startPos + 2, i)),
                    startPos: state.startPos,
                    endPos: i + 1,
                    kind: state.kind
                });
                state = {
                    mode: 'outside',
                    kind: ''
                };
            }
        }
        i++;
    }
    return results;
}
module.exports = init;
//# sourceMappingURL=index.js.map