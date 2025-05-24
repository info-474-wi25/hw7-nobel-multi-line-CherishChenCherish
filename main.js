// 1: SET GLOBAL VARIABLES
const margin = { top: 50, right: 30, bottom: 60, left: 70 };
const width = 800 - margin.left - margin.right;
const height = 400 - margin.top - margin.bottom;

// Create the SVG container and group element for the chart
const svgLine = d3.select("#lineChart")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

// 2: LOAD DATA
d3.csv("nobel_laureates.csv").then(data => {
    // Relevant columns:
    // - fullname -> name (y variable)
    // - year (x variable)
    // - category (color variable)

    // 2.a: REFORMAT DATA
    data.forEach(d => {
        d.year = +d.year;       // Convert year to a number
        d.name = d.fullname;    // Rename column for clarity
    });

    // Check your work:
    // console.log("Raw data:", data);
    // console.log("Years:", data.map(d => d.year));

    // --- STUDENTS START HERE ---
    // 3: PREPARE DATA
    // 3.a: Categorize data into STEM and Non-STEM
    // Example: Group "physics" into STEM, "literature" into Non-STEM
    const stemCategories = ["physics", "chemistry", "medicine"];
    const nonStemCategories = ["literature", "peace", "economics"];
    
    data.forEach(d => {
        if (stemCategories.includes(d.category)) {
            d.categoryGroup = "STEM";
        } else if (nonStemCategories.includes(d.category)) {
            d.categoryGroup = "Non-STEM";
        }
    });

    // 3.b: Group data by categoryGroup and year, and count entries
    // Use d3.rollup to create a nested data structure
    const groupedData = d3.rollup(data, 
        v => v.length,  // Count entries
        d => d.categoryGroup, // Group by STEM/Non-STEM first
        d => d.year     // Then by year
    );

    // Check your work:
    console.log("Categories:", groupedData);

    // Convert nested Map to array format for D3 line generator
    const categories = Array.from(groupedData, ([categoryGroup, yearData]) => ({
        category: categoryGroup,
        values: Array.from(yearData, ([year, count]) => ({
            year: year,
            count: count
        })).sort((a, b) => a.year - b.year) // Sort by year
    }));

    // 4: SET SCALES
    // 4.a: Define xScale for years using d3.scaleLinear
    const allYears = data.map(d => d.year);
    const xScale = d3.scaleLinear()
        .domain(d3.extent(allYears))
        .range([0, width]);

    // 4.b: Define yScale based on the max count of laureates
    const maxCount = d3.max(categories, d => d3.max(d.values, v => v.count));
    const yScale = d3.scaleLinear()
        .domain([0, maxCount])
        .range([height, 0]);

    // 4.c: Define colorScale using d3.scaleOrdinal with categories as the domain
    const colorScale = d3.scaleOrdinal()
        .domain(["STEM", "Non-STEM"])
        .range(["#2E86AB", "#F24236"]); // Blue for STEM, Orange for Non-STEM

    // 5: PLOT LINES
    // 5.a: CREATE PATH
    // - Use d3.line() to generate paths from grouped data.
    // - Convert the nested data structure into an array of objects containing x (year) and y (count).
    const line = d3.line()
        .x(d => xScale(d.year))
        .y(d => yScale(d.count))
        .curve(d3.curveLinear); // Use linear interpolation for sharp lines

    // 5.b: PLOT LINE
    // - Bind data to <path> elements and use the "d" attribute to draw lines.
    // - Add a "class" to each line for styling.
    svgLine.selectAll(".line")
        .data(categories)
        .enter()
        .append("path")
        .attr("class", "line")
        .attr("d", d => line(d.values));

    // 5.c: ADD STYLE
    // - Use the colorScale to set the "stroke" attribute for each line.
    // - Add stroke-width and optional hover effects.
    svgLine.selectAll(".line")
        .style("stroke", d => colorScale(d.category))
        .style("stroke-width", 2)
        .style("fill", "none")
        .on("mouseover", function() {
            d3.select(this).style("stroke-width", 3);
        })
        .on("mouseout", function() {
            d3.select(this).style("stroke-width", 2);
        });

    // 6: ADD AXES
    // 6.a: X-AXIS
    // - Use d3.axisBottom(xScale) to create the x-axis.
    // - Append it to the bottom of the SVG.
    svgLine.append("g")
        .attr("class", "x-axis")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(xScale).tickFormat(d3.format("d")));

    // 6.b: Y-AXIS
    // - Use d3.axisLeft(yScale) to create the y-axis.
    // - Append it to the left of the SVG.
    svgLine.append("g")
        .attr("class", "y-axis")
        .call(d3.axisLeft(yScale));

    // 7: ADD LABELS
    // 7.a: Title
    // - Add a text element above the chart for the chart title.
    svgLine.append("text")
        .attr("class", "chart-title")
        .attr("x", width / 2)
        .attr("y", -20)
        .style("text-anchor", "middle")
        .style("font-size", "18px")
        .style("font-weight", "bold")
        .text("Nobel Laureates: STEM vs Non-STEM Over Time");

    // 7.b: X-axis label
    // - Add a text element below the x-axis to describe it (e.g., "Year").
    svgLine.append("text")
        .attr("class", "axis-label")
        .attr("x", width / 2)
        .attr("y", height + 45)
        .style("text-anchor", "middle")
        .style("font-size", "14px")
        .text("Year");

    // 7.c: Y-axis label
    // - Add a rotated text element beside the y-axis to describe it (e.g., "Number of Laureates").
    svgLine.append("text")
        .attr("class", "axis-label")
        .attr("transform", "rotate(-90)")
        .attr("x", -height / 2)
        .attr("y", -45)
        .style("text-anchor", "middle")
        .style("font-size", "14px")
        .text("Number of Laureates");

    // 8: LEGEND
    // 8.a: CREATE AND POSITION SHAPE
    // - Use <g> elements to create groups for each legend item.
    // - Position each legend group horizontally or vertically.
    const legend = svgLine.append("g")
        .attr("class", "legend")
        .attr("transform", `translate(${width - 120}, -50)`);

    const legendItems = legend.selectAll(".legend-item")
        .data(categories)
        .enter()
        .append("g")
        .attr("class", "legend-item")
        .attr("transform", (d, i) => `translate(0, ${i * 25})`);

    // 8.b: ADD COLOR SQUARES
    // - Append <rect> elements to the legend groups.
    // - Use colorScale to set the "fill" attribute for each square.
    legendItems.append("rect")
        .attr("width", 18)
        .attr("height", 18)
        .style("fill", d => colorScale(d.category))
        .style("stroke", "#333")
        .style("stroke-width", 1);

    // 8.c: ADD TEXT
    // - Append <text> elements to the legend groups.
    // - Position and align the text beside each color square.
    legendItems.append("text")
        .attr("x", 25)
        .attr("y", 9)
        .attr("dy", "0.35em")
        .style("font-size", "13px")
        .text(d => d.category);
});