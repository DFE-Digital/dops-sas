function getDates(startWeek, endWeek, endDateEstimated) {
    let dates = [];
  
    console.log('getDates')
    console.log(startWeek)
    console.log(endWeek)
    console.log(endDateEstimated)
  
    endWeek = endDateEstimated === undefined ? 12 : endWeek;
  
    for (let week = startWeek; week <= endWeek; week++) {
      let weekDate = getMonday(addWeeksToDate(new Date(), week).toISOString());
  
      // If endDateEstimated is undefined or if it is greater than or equal to weekDate
      if (endDateEstimated === undefined || endDateEstimated >= weekDate) {
        dates.push({
          week: weekDate.toLocaleDateString('en-GB', {
            day: 'numeric',
            month: 'long',
          }),
        });
      }
    }
  
    console.log(dates)
  
    return dates;
  }
  
  function getMonday(d) {
    d = new Date(d);
    var day = d.getDay(),
      diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.setDate(diff));
  }
  
  function addWeeksToDate(date, weeks) {
    //console.log('Adding ' + weeks + ' weeks to ' + date);
    //console.log(date);
    date.setDate(date.getDate() + 7 * weeks);
    return date;
  }
  


module.exports = {
   getDates
  };