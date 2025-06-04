const axios = require('axios');
const xml2js = require('xml2js');

const BGG_API_URL = 'https://boardgamegeek.com/xmlapi2';
const parser = new xml2js.Parser({ explicitArray: false });

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

const getName = nameField => {
  if (!nameField) return '';
  if (Array.isArray(nameField)) {
    const primary = nameField.find(n => n.$.type === 'primary');
    if (primary) return primary.$.value;
    return nameField[0].$.value || '';
  } else {
    if (nameField.$?.type === 'primary') return nameField.$.value;
    return nameField.$?.value || '';
  }
};

exports.searchGames = async query => {
  await delay(1000);
  try {
    const response = await axios.get(`${BGG_API_URL}/search`, {
      params: {
        query,
        type: 'boardgame'
      }
    });

    const result = await parser.parseStringPromise(response.data);

    if (!result.items || !result.items.item) return [];

    const items = Array.isArray(result.items.item)
      ? result.items.item
      : [result.items.item];

    return items
      .slice(0, 20)
      .map(item => ({
        bggId: item.$.id,
        name: getName(item.name),
        yearPublished: item.yearpublished ? item.yearpublished.$.value : null
      }))
      .filter(game => game.name);
  } catch (error) {
    console.error('Error searching BGG games:', error);
    return [];
  }
};

exports.getGameDetails = async gameId => {
  await delay(1000);
  try {
    const response = await axios.get(`${BGG_API_URL}/thing`, {
      params: { id: gameId, stats: 1 }
    });

    const result = await parser.parseStringPromise(response.data);
    const item = result.items.item;

    const name = getName(item.name);
    const image = item.image || '/placeholder.svg?height=300&width=300';

    if (!name || name.trim() === '' || image.includes('placeholder')) {
      return null;
    }

    return {
      bggId: gameId,
      name: getName(item.name),
      image: item.image || '/placeholder.svg?height=300&width=300',
      thumbnail: item.thumbnail || '/placeholder.svg?height=150&width=150',
      minPlayers: item.minplayers ? parseInt(item.minplayers.$.value) : 1,
      maxPlayers: item.maxplayers ? parseInt(item.maxplayers.$.value) : 1,
      playingTime: item.playingtime ? parseInt(item.playingtime.$.value) : 0,
      minPlayTime: item.minplaytime ? parseInt(item.minplaytime.$.value) : 0,
      maxPlayTime: item.maxplaytime ? parseInt(item.maxplaytime.$.value) : 0,
      yearPublished: item.yearpublished ? item.yearpublished.$.value : null,
      description: item.description || '',
      rating: item.statistics?.ratings
        ? parseFloat(item.statistics.ratings.average.$.value)
        : 0,
      complexity: item.statistics?.ratings
        ? parseFloat(item.statistics.ratings.averageweight.$.value)
        : 0,
      categories: item.link
        ? item.link
            .filter(link => link.$.type === 'boardgamecategory')
            .map(cat => cat.$.value)
        : [],
      mechanics: item.link
        ? item.link
            .filter(link => link.$.type === 'boardgamemechanic')
            .map(mech => mech.$.value)
        : []
    };
  } catch (error) {
    console.error('Error getting game details:', error);
    return null;
  }
};

exports.getHotGames = async () => {
  try {
    const response = await axios.get(`${BGG_API_URL}/hot`, {
      params: {
        type: 'boardgame'
      }
    });

    const result = await parser.parseStringPromise(response.data);

    if (!result.items || !result.items.item) return [];

    const items = Array.isArray(result.items.item)
      ? result.items.item
      : [result.items.item];

    return items.slice(0, 10).map(item => ({
      bggId: item.$.id,
      name: getName(item.name),
      thumbnail: item.thumbnail || '/placeholder.svg?height=50&width=50',
      rank: item.$.rank ? parseInt(item.$.rank) : null
    }));
  } catch (error) {
    console.error('Error getting BGG hot games:', error);
    return [];
  }
};

exports.getBestsellers = async (ids = []) => {
  if (ids.length === 0) return [];

  const idsParam = ids.join(',');

  await delay(1000);

  try {
    const response = await axios.get(`${BGG_API_URL}/thing`, {
      params: {
        id: idsParam,
        stats: 1
      }
    });


    const result = await parser.parseStringPromise(response.data);

    if (!result.items || !result.items.item) {
      return [];
    }

    const items = Array.isArray(result.items.item)
      ? result.items.item
      : [result.items.item];

    const mappedGames = items
      .map(game => {
        try {
          // Usar la función getName que ya existe
          const name = getName(game.name);

          const stats = game.statistics?.ratings;
          if (!stats) {
            return null;
          }

          // Manejar el ranking de manera más robusta
          let rank = null;
          if (stats.ranks && stats.ranks.rank) {
            const rankData = stats.ranks.rank;
            if (Array.isArray(rankData)) {
              const boardgameRank = rankData.find(
                r => r.$.name === 'boardgame'
              );
              if (boardgameRank && boardgameRank.$.value !== 'Not Ranked') {
                rank = parseInt(boardgameRank.$.value, 10);
              }
            } else if (
              rankData.$.name === 'boardgame' &&
              rankData.$.value !== 'Not Ranked'
            ) {
              rank = parseInt(rankData.$.value, 10);
            }
          }

          return {
            bggId: game.$.id,
            name: name,
            image: game.image || '/placeholder.svg?height=300&width=300',
            thumbnail:
              game.thumbnail || '/placeholder.svg?height=150&width=150',
            yearPublished: game.yearpublished
              ? game.yearpublished.$.value
              : null,
            numowned: stats.numowned ? parseInt(stats.numowned.$.value, 10) : 0,
            rank: rank,
            averageRating: stats.average
              ? parseFloat(stats.average.$.value)
              : 0,
            minPlayers: game.minplayers ? parseInt(game.minplayers.$.value) : 1,
            maxPlayers: game.maxplayers ? parseInt(game.maxplayers.$.value) : 1,
            playingTime: game.playingtime
              ? parseInt(game.playingtime.$.value)
              : 0
          };
        } catch (error) {
          console.error(`Error processing game ${game.$.id}:`, error);
          return null;
        }
      })
      .filter(game => game !== null);


    // Ordenar por número de propietarios (bestsellers)
    return mappedGames.sort((a, b) => b.numowned - a.numowned);
  } catch (error) {
    console.error('Error fetching BGG bestsellers:', error);
    return [];
  }
};
