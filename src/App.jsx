import { useState, useEffect, useRef } from 'react';
import { Trie } from './Trie';
import { fetchDictionaryDefinition } from './api';

function App() {
    const [searchTerm, setSearchTerm] = useState('');
    const [suggestions, setSuggestions] = useState([]);
    const [selectedWord, setSelectedWord] = useState(null);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [recentSearches, setRecentSearches] = useState([]);
    const [highlightedIndex, setHighlightedIndex] = useState(-1);

    const trieRef = useRef(null);

    useEffect(() => {
        trieRef.current = new Trie();

        const loadWords = async () => {
            try {
                const response = await fetch('/10000wordlist.txt');
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                const text = await response.text();
                const words = text.split('\n').map(word => word.trim()).filter(word => word.length > 0);
                words.forEach(word => trieRef.current.insert(word));
                console.log(`Trie populated with ${words.length} words.`);
            } catch (error) {
                console.error("Failed to load word list:", error);
            }
        };

        loadWords();
    }, []);

    const handleChange = (e) => {
        const value = e.target.value;
        setSearchTerm(value);
        if (value.length > 0) {
            const newSuggestions = trieRef.current.searchPrefix(value.toLowerCase());
            setSuggestions(newSuggestions);
            setIsDropdownOpen(newSuggestions.length > 0);
            setHighlightedIndex(-1); 
        } else {
            setSuggestions([]);
            setIsDropdownOpen(false);
            setHighlightedIndex(-1); 
        }
    };

    const handleSearch = async (word) => {
        if (!word) return;

        setSelectedWord(null); 
        const definitionData = await fetchDictionaryDefinition(word);

        if (definitionData && typeof definitionData === 'object' && definitionData.word) {
            setSelectedWord(definitionData);
        } else {
            setSelectedWord({
                word: word,
                phonetic: '',
                meanings: [{ partOfSpeech: '', definitions: [{ definition: definitionData || 'Definition not found.' }] }]
            });
        }

        setSearchTerm(word);
        setSuggestions([]);
        setIsDropdownOpen(false);
        setHighlightedIndex(-1);

        setRecentSearches(prev => {
            const newSearches = [word, ...prev.filter(w => w !== word)];
            return newSearches.slice(0, 3);
        });
    };

    const handleKeyDown = (e) => {
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setHighlightedIndex(prevIndex =>
                Math.min(prevIndex + 1, suggestions.length - 1)
            );
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setHighlightedIndex(prevIndex => Math.max(prevIndex - 1, -1));
        } else if (e.key === 'Enter') {
            if (highlightedIndex !== -1 && suggestions[highlightedIndex]) {
                handleSearch(suggestions[highlightedIndex]);
            } else {
                handleSearch(searchTerm);
            }
            setSuggestions([]);
            setIsDropdownOpen(false);
            setHighlightedIndex(-1);
        }
    };

    return (
        <div className="min-h-screen flex flex-col items-center py-12 px-4">
            <div className="w-full max-w-2xl">
                <h1 className="text-3xl font-bold md:text-4xl text-center text-gray-800 mb-8">
                    Trie Dictionary
                </h1>

                <div className="relative mb-12">
                    <div className="relative">
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={handleChange}
                            onKeyDown={handleKeyDown}
                            onFocus={() => setIsDropdownOpen(suggestions.length > 0)}
                            placeholder="Search for a word..."
                            className="w-full px-6 py-4 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-amber-100 focus:border-amber-300 text-gray-700 placeholder-gray-400 transition-all duration-200"
                        />
                        <button
                            onClick={() => handleSearch(searchTerm)}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-amber-600 transition-colors"
                        >
                            <i className="fas fa-search"></i>
                        </button>
                    </div>

                    {isDropdownOpen && suggestions.length > 0 && (
                        <div className="absolute z-10 mt-1 w-full bg-white rounded-lg search-dropdown overflow-hidden">
                            <ul>
                                {suggestions.map((word, index) => (
                                    <li
                                        key={index}
                                        onClick={() => handleSearch(word)}
                                        className={`px-6 py-3 ${index === highlightedIndex ? 'bg-amber-50' : 'hover:bg-amber-50'} cursor-pointer transition-colors flex items-center`}
                                    >
                                        <span className="text-amber-700 font-medium">{word}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>

                {recentSearches.length > 0 && (
                    <div className="mb-8">
                        <h3 className="text-sm font-medium text-gray-500 mb-2">Recent searches</h3>
                        <div className="flex flex-wrap gap-2">
                            {recentSearches.map((word, index) => (
                                <button
                                    key={index}
                                    onClick={() => handleSearch(word)}
                                    className="px-3 py-1.5 text-xs rounded-full bg-amber-50 text-amber-700 hover:bg-amber-100 transition-colors"
                                >
                                    {word}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {selectedWord ? (
                    <div className="definition-card bg-white rounded-lg p-6 border border-gray-100">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h2 className="text-2xl font-medium text-gray-800">{selectedWord.word}</h2>
                                <p className="text-amber-600 text-sm mt-1">{selectedWord.phonetic}</p>
                            </div>
                            <button
                                onClick={() => {
                                    const utterance = new SpeechSynthesisUtterance(selectedWord.word);
                                    window.speechSynthesis.speak(utterance);
                                }}
                                className="text-gray-400 hover:text-amber-600 transition-colors"
                            >
                                <i className="fas fa-volume-up"></i>
                            </button>
                        </div>

                        <div className="space-y-4">
                            {selectedWord.meanings && selectedWord.meanings.map((meaning, meaningIndex) => (
                                <div key={meaningIndex} className="pb-4 border-b border-gray-100 last:border-0">
                                    <span className="type-badge inline-block px-2 py-1 rounded bg-amber-100 text-amber-700 font-medium mb-2">
                                        {meaning.partOfSpeech}
                                    </span>
                                    {meaning.definitions.map((def, defIndex) => (
                                        <div key={defIndex}>
                                            <p className="text-gray-700 mb-2">{`${defIndex + 1}. ${def.definition}`}</p>
                                            {def.example && (
                                                <p className="text-gray-500 italic mb-1">"{def.example}"</p>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="text-center py-12">
                        <i className="fas fa-book-open text-4xl text-gray-300 mb-4"></i>
                        <p className="text-gray-400">Search for a word to see its definition</p>
                    </div>
                )}
            </div>

            <footer className="mt-auto pt-12 text-center text-xs text-gray-400">
                <p>Made with ❤️ by Avishek Paul</p>
            </footer>
        </div>
    );
}

export default App;
