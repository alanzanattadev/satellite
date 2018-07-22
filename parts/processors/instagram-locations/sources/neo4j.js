const neo4j = require('neo4j-driver').v1;

const logger = require('./logger');

const neo4jUrl = 'bolt://localhost';

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

const insertLocation = async (session, location, username) => {
  const request = 'MATCH (user:Instagram { username: {username} })\
  CREATE (user)-[r:LOCATED { at: {location.time} }]->(location:Location {location}) RETURN location.name';
  try {
    console.log(location);
    const result = await session.run(request, { username, location });
    return (result.records.length === 1);
  } catch (error) {
    logger.error(error);
  }
  return false;
};

const addLocations = async (session, { profile, posts }) => posts.reduce(async (ret, post) => {
  const { time } = post;
  const locationRet = await insertLocation(session, {
    ...post.location,
    time,
    userDefined: true,
  }, profile.username);
  const pRet = post.possibleLocations.reduce(async (possibleRet, possibleLocation) => {
    if (await insertLocation(session, {
      ...possibleLocation,
      time,
      userDefined: false,
    }, profile.username) === false) {
      return false;
    }
    return possibleRet;
  }, true);
  return (!locationRet || !pRet ? false : ret);
}, true);

module.exports = async (json) => {
  const driver = neo4j.driver(neo4jUrl, neo4j.auth.basic('neo4j', 'test'));
  const session = driver.session();
  const ret = (
    await updateOrCreateProfile(session, json)
    && await addLocations(session, json)
  );
  driver.close();
  return ret;
};
