const fetchDictionaryDefinition = async (word) => {
    try {
        const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${word}`);
        if (!response.ok) {
            if (response.status === 404) {
                return { word: word, phonetic: '', meanings: [{ partOfSpeech: '', definitions: [{ definition: "Definition not found." }] }] };
            }
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        if (data && data.length > 0) {
            return data[0]; 
        } else {
            return { word: word, phonetic: '', meanings: [{ partOfSpeech: '', definitions: [{ definition: "Definition not found." }] }] };
        }
    } catch (error) {
        console.error("Error fetching dictionary definition:", error);
        return { word: word, phonetic: '', meanings: [{ partOfSpeech: '', definitions: [{ definition: "Error fetching definition." }] }] };
    }
};

export { fetchDictionaryDefinition };
