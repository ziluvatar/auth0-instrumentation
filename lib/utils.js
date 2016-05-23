exports.tag = function(key, val) {
  return key+':'+val;
};

exports.processTags = function(tags) {
  if (Array.isArray(tags)) return tags;
  else if (typeof tags === 'object') {
    var processedTags = [];
    for (var key in tags) {
      processedTags.push(exports.tag(key, tags[key]));
    }
    return processedTags;
  }
  return [];
};
