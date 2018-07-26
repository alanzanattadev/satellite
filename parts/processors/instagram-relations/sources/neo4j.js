const neo4j = require('neo4j-driver').v1;

const logger = require('./logger');

const neo4jUrl = process.env.NEO4J_URL || 'bolt://localhost';
const neo4jAuth = neo4j.auth.basic(
  process.env.NEO4J_USER || 'neo4j',
  process.env.NEO4J_PASS || 'neo4j',
);

const updateOrCreateProfile = async (session, { profile }) => {
  const request = 'MERGE (user:Instagram { username: {username} })\
  ON CREATE SET user = {profile}, user.createdAt = timestamp()\
  ON MATCH SET user = {profile}, user.updatedAt = timestamp()\
  RETURN user.username';

  try {
    const result = await session.run(request, { username: profile.username, profile });
    return (result.records.length === 1);
  } catch (error) {
    logger.error(error);
  }
  return false;
};

const insertRelation = async (session, otherUser, followDirection, username) => {
  const insertRequest = 'MERGE (other:Instagram { username: {otherUsername}, id: {otherID} })\
  ON CREATE SET other = {profile}, user.createdAt = timestamp()\
  ON MATCH SET other = {profile}, user.updatedAt = timestamp()\
  RETURN other.id';

  const linkRequest = `MATCH (user:Instagram { username: {username} }), (other:Instagram { username: {otherUsername} })\
  CREATE (user)${followDirection ? '' : '<'}-[r:FOLLOW]-${followDirection ? '>' : ''}(other) RETURN other.id`;
  try {
    const resultInsert = await session.run(insertRequest, {
      otherUsername: otherUser.username,
      otherID: otherUser.id,
      profile: otherUser,
    });
    if (resultInsert.records.length !== 1) {
      return false;
    }
    const linkResult = await session.run(linkRequest,
      { username, otherUsername: otherUser.username });
    return (linkResult.records.length === 1);
  } catch (error) {
    logger.error(error);
  }
  return false;
};

const addRelations = async (session, { profile, followers, following }) => (
  followers.reduce(async (ret, follow) => {
    if (await insertRelation(session, follow, true, profile.username) === false) {
      return false;
    }
    return ret;
  }, true) && following.reduce(async (ret, follow) => {
    if (await insertRelation(session, follow, false, profile.username) === false) {
      return false;
    }
    return ret;
  }, true)
);

module.exports = async (json) => {
  const driver = neo4j.driver(neo4jUrl, neo4jAuth);
  const session = driver.session();
  const ret = (
    await updateOrCreateProfile(session, json)
    && await addRelations(session, json)
  );
  driver.close();
  return ret;
};
