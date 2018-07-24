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

const insertLocation = async (session, location, time, userDefined, username) => {
  const request = 'MATCH (user:Instagram { username: {username} })\
  CREATE (user)-[r:LOCATED { time: {time}, userDefined: {userDefined} }]->(location:Location {location})\
  RETURN location.name';
  try {
    const result = await session.run(request, { username, location, time, userDefined });
    return (result.records.length === 1);
  } catch (error) {
    logger.error(error);
  }
  return false;
};

const addLocations = async (session, { profile, posts }) => posts.reduce(async (ret, post) => {
  const { time } = post;
  const locationRet = (!post.location ? true
    : await insertLocation(session, post.location, time, true, profile.username));
  const pRet = post.possibleLocations.reduce(async (possibleRet, possibleLocation) => {
    if (await insertLocation(session, possibleLocation, time, false, profile.username) === false) {
      return false;
    }
    return possibleRet;
  }, true);
  return (!locationRet || !pRet ? false : ret);
}, true);

module.exports = async (json) => {
  const driver = neo4j.driver(neo4jUrl, neo4jAuth);
  const session = driver.session();
  const ret = (
    await updateOrCreateProfile(session, json)
    && await addLocations(session, json)
  );
  driver.close();
  return ret;
};
