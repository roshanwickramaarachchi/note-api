const advancedResults = (model) => async (req, res, next) => {
    let query;
  
    // Copy req.query
    const reqQuery = { ...req.query };  
  
    // Create query string
    let queryStr = JSON.stringify(reqQuery);  
  
    // Finding resource
    query = model.find(JSON.parse(queryStr));  

    query = query.sort('-createdAt');  
  
    const results = await query;
  
    res.advancedResults = {
      success: true,
      count: results.length,
      data: results,
    };
  
    next();
  };
  
  module.exports = advancedResults;
  