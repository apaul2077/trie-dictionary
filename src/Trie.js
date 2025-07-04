class TrieNode {
    constructor() {
        this.children = {};
        this.isEndOfWord = false;
    }
}

class Trie {
    constructor() {
        this.root = new TrieNode();
    }

    insert(word) {
        let node = this.root;
        for (const char of word) {
            if (!node.children[char]) {
                node.children[char] = new TrieNode();
            }
            node = node.children[char];
        }
        node.isEndOfWord = true;
    }

    searchPrefix(prefix) {
        let node = this.root;
        for (const char of prefix) {
            if (!node.children[char]) {
                return []; 
            }
            node = node.children[char];
        }

        const suggestions = [];
        this._findAllWords(node, prefix, suggestions);
        return suggestions.slice(0, 10); 
    }

    _findAllWords(node, currentPrefix, suggestions) {
        if (suggestions.length >= 10) {
            return;
        }

        if (node.isEndOfWord) {
            suggestions.push(currentPrefix);
        }

        for (const char in node.children) {
            this._findAllWords(node.children[char], currentPrefix + char, suggestions);
        }
    }
}

export { Trie, TrieNode };
