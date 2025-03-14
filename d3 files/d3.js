// Load the data
const socialMedia = d3.csv("socialMedia.csv");

// Once the data is loaded, proceed with plotting
socialMedia.then(function(data) {
    // Convert string values to numbers
    data.forEach(function(d) {
        d.Likes = +d.Likes;
    });

    // Define the dimensions and margins for the SVG
    let margin = { top: 20, right: 30, bottom: 50, left: 50 },
      width = 800 - margin.left - margin.right,
      height = 500 - margin.top - margin.bottom;

    // Create the SVG container
    let svg = d3.select("#boxplot")
      .append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", `translate(${margin.left}, ${margin.top})`);

    // Set up scales for x and y axes

    // x: unique platforms
    let xScale = d3.scaleBand()
      .domain([...new Set(data.map(d => d.Platform))]) 
      .range([0, width])
      .padding(0.2);

    // y: number of likes
    let yScale = d3.scaleLinear()
      .domain([0, d3.max(data, d => d.Likes)]) 
      .range([height, 0]);
    
    // Add scales     
    svg.append("g")
      .attr("transform", `translate(0, ${height})`)
      .call(d3.axisBottom(xScale));

    svg.append("g")
      .call(d3.axisLeft(yScale));

    // Add x-axis label
    svg.append("text")
      .attr("x", width / 2)
      .attr("y", height + margin.bottom - 10)
      .attr("text-anchor", "middle")
      .text("Platform");

    // Add y-axis label
    svg.append("text")
      .attr("transform", "rotate(-90)")
      .attr("x", -height / 2)
      .attr("y", -margin.left + 15)
      .attr("text-anchor", "middle")
      .text("Number of Likes");

    // finished rollupFunction
    const rollupFunction = function(groupData) {
        const values = groupData.map(d => d.Likes).sort(d3.ascending);
        const min = d3.min(values);
        const q1 = d3.quantile(values, 0.25);
        const median = d3.quantile(values, 0.5);
        const q3 = d3.quantile(values, 0.75);
        const max = d3.max(values);
        return { min, q1, median, q3, max };
    };

    // compute quantiles for each group/platform
    const quantilesByGroups = d3.rollup(data, rollupFunction, d => d.Platform);

    // iterate over each group/platform to make boxplot
    quantilesByGroups.forEach((quantiles, Platform) => {
        const x = xScale(Platform);
        const boxWidth = xScale.bandwidth();

        // Draw vertical lines
        svg.append("line")
          .attr("x1", x + boxWidth / 2)
          .attr("x2", x + boxWidth / 2)
          .attr("y1", yScale(quantiles.min)) 
          .attr("y2", yScale(quantiles.max))
          .attr("stroke", "black");

        // Draw box
        svg.append("rect")
          .attr("x", x)
          .attr("y", yScale(quantiles.q3))
          .attr("width", boxWidth)
          .attr("height", Math.max(1, yScale(quantiles.q1) - yScale(quantiles.q3)))
          .attr("fill", "lightgray")
          .attr("stroke", "black");

        // Draw median line
        svg.append("line")
          .attr("x1", x)
          .attr("x2", x + boxWidth)
          .attr("y1", yScale(quantiles.median))
          .attr("y2", yScale(quantiles.median))
          .attr("stroke", "black")
          .attr("stroke-width", 2);
    });
});

// Prepare you data and load the data again. 
// This data should contains three columns, platform, post type and average number of likes. 
const socialMediaAvg = d3.csv("SocialMediaAvg.csv");

socialMediaAvg.then(function(data) {
    // Convert string values to numbers
    data.forEach(function(d) {
      d.AvgLikes = +d.AvgLikes;
    });

    // Define the dimensions and margins for the SVG
    let margin = { top: 40, right: 150, bottom: 50, left: 60 },
        width = 800 - margin.left - margin.right,
        height = 500 - margin.top - margin.bottom;

    // Create the SVG container
    let svg = d3.select("#barplot")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left}, ${margin.top})`);

    // Define four scales
    // Scale x0 is for the platform, which divide the whole scale into 4 parts
    // Scale x1 is for the post type, which divide each bandwidth of the previous x0 scale into three part for each post type
    // Recommend to add more spaces for the y scale for the legend
    // Also need a color scale for the post type

    const x0 = d3.scaleBand()
        .domain([...new Set(data.map(d => d.Platform))])
        .range([0, width])
        .padding(0.2);

    const x1 = d3.scaleBand()
        .domain([...new Set(data.map(d => d.PostType))])
        .range([0, x0.bandwidth()])
        .padding(0.1);

    const y = d3.scaleLinear()
        .domain([0, d3.max(data, d => d.AvgLikes) * 1.4])
        .range([height, 0]);

    const color = d3.scaleOrdinal()
      .domain([...new Set(data.map(d => d.PostType))])
      .range(["#1f77b4", "#ff7f0e", "#2ca02c"]);    
         
    // Add scales x0 and y     
    svg.append("g")
        .attr("transform", `translate(0, ${height})`)
        .call(d3.axisBottom(x0));

    svg.append("g")
        .call(d3.axisLeft(y));

    // Add x-axis label
    svg.append("text")
        .attr("x", width / 2)
        .attr("y", height + margin.bottom - 10)
        .attr("text-anchor", "middle")
        .text("Platform");

    // Add y-axis label
    svg.append("text")
        .attr("transform", "rotate(-90)")
        .attr("x", -height / 2)
        .attr("y", -margin.left + 15)
        .attr("text-anchor", "middle")
        .text("Average Number of Likes");

    // Group container for bars
    const barGroups = svg.selectAll(".barGroup")
        .data(data)
        .enter()
        .append("g")
        .attr("class", "barGroup")
        .attr("transform", d => `translate(${x0(d.Platform)}, 0)`);

    // Draw bars
    barGroups.append("rect")
        .attr("x", d => x1(d.PostType))
        .attr("y", d => y(d.AvgLikes))
        .attr("width", x1.bandwidth())
        .attr("height", d => height - y(d.AvgLikes))
        .attr("fill", d => color(d.PostType));
      
    // Add the legend
    const legend = svg.append("g")
      .attr("transform", `translate(${width - 100}, ${margin.top})`);

    const types = [...new Set(data.map(d => d.PostType))];
 
    types.forEach((type, i) => {

    // Alread have the text information for the legend. 
    // Now add a small square/rect bar next to the text with different color.
      legend.append("text")
          .attr("x", 20)
          .attr("y", i * 20 + 12)
          .text(type)
          .attr("alignment-baseline", "middle");

      legend.append("rect")
          .attr("x", 0)
          .attr("y", i * 20)
          .attr("width", 15)
          .attr("height", 15)
          .attr("fill", color(type));
  });

});

// Prepare you data and load the data again. 
// This data should contains two columns, date (3/1-3/7) and average number of likes. 
const socialMediaTime = d3.csv("SocialMediaTime.csv");

socialMediaTime.then(function(data) {
    // Convert string values to numbers
    data.forEach(function(d) {
      d.AvgLikes = +d.AvgLikes; // Convert AvgLikes to numeric
    });

    // Define the dimensions and margins for the SVG
    let margin = { top: 40, right: 50, bottom: 60, left: 60 },
        width = 800 - margin.left - margin.right,
        height = 500 - margin.top - margin.bottom;

    // Create the SVG container
    let svg = d3.select("#lineplot")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left}, ${margin.top})`);

    // Set up scales for x and y axes  
    let x = d3.scaleBand()
        .domain(data.map(d => d.Date))
        .range([0, width])
        .padding(0.1);

    let y = d3.scaleLinear()
        .domain([d3.min(data, d => d.AvgLikes) * 0.9, d3.max(data, d => d.AvgLikes) * 1.1])
        .range([height, 0]);

    // Draw the axis, you can rotate the text in the x-axis here
    svg.append("g")
        .attr("transform", `translate(0, ${height})`)
        .call(d3.axisBottom(x))
        .selectAll("text")
        .style("text-anchor", "end") 
        .attr("transform", "rotate(-25)");

    svg.append("g")
        .call(d3.axisLeft(y));

    // Add x-axis label
    svg.append("text")
        .attr("x", width / 2)
        .attr("y", height + margin.bottom - 10)
        .attr("text-anchor", "middle")
        .text("Date");

    // Add y-axis label
    svg.append("text")
        .attr("transform", "rotate(-90)")
        .attr("x", -height / 2)
        .attr("y", -margin.left + 15)
        .attr("text-anchor", "middle")
        .text("Average Number of Likes");

    // Draw the line and path. Remember to use curveNatural. 

    let line = d3.line()
        .x(d => x(d.Date) + x.bandwidth() / 2)
        .y(d => y(d.AvgLikes))
        .curve(d3.curveNatural);

    svg.append("path")
        .datum(data)
        .attr("fill", "none")
        .attr("stroke", "#1f77b4")
        .attr("stroke-width", 2)
        .attr("d", line);

    svg.selectAll(".dot")
        .data(data)
        .enter()
        .append("circle")
        .attr("cx", d => x(d.Date) + x.bandwidth() / 2)
        .attr("cy", d => y(d.AvgLikes))
        .attr("r", 4)
        .attr("fill", "#1f77b4");
});