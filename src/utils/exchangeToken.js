module.exports = async function exchangeToken(token) {
  try {
    return (await (await fetch("https://api.acord.app/auth/exchange?acordToken=" + token)).json())?.data?.id;
  } catch {
    return undefined;
  }
}