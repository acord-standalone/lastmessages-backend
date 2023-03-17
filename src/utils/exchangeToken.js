const cache = new Map();

module.exports = async function exchangeToken(token) {
  try {
    let id = (await (await fetch("https://api.acord.app/auth/exchange?acordToken=" + token)).json())?.data?.id;
    cache.set(token, { at: Date.now(), id });
    return id;
  } catch {
    return undefined;
  }
}

setInterval(() => {
  cache.forEach((i, token) => {
    if ((Date.now() - i.at) > 60000 * 5) cache.delete(token);
  });
}, 60000 * 5);