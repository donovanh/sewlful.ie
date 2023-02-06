const fs = require("fs");
const pluginRSS = require("@11ty/eleventy-plugin-rss");
const syntaxHighlight = require("@11ty/eleventy-plugin-syntaxhighlight");
const pluginTOC = require("eleventy-plugin-toc");
const markdownItAnchor = require("markdown-it-anchor");
const moment = require("moment");
moment.locale("en");

module.exports = function (eleventyConfig) {
  // allows templates to add additional data
  eleventyConfig.setDataDeepMerge(true);

  // copy static files directly, with same directory structure
  eleventyConfig.addPassthroughCopy("src/assets");

  eleventyConfig.addPassthroughCopy("src/CNAME");

  // eleventyConfig.addPassthroughCopy("src/books");

  // parse excerpts on posts
  eleventyConfig.setFrontMatterParsingOptions({
    excerpt: true,
    excerpt_separator: "<!-- excerpt -->",
    excerpt_alias: "post_excerpt",
  });

  // filter to return a date as ISO string objects
  // todo: Use built-in JS functions
  eleventyConfig.addFilter("dateISO", (date) => {
    return moment(date).toISOString();
  });

  // filter to return a date for prettier display. Uses UTC to avoid timezone differences
  eleventyConfig.addFilter("datePretty", (date) => {
    return moment(date).utc().format("LL"); // TODO: add locale formatting
  });

  // filter to sort a list of posts by date desc
  // https://stackoverflow.com/q/10123953
  eleventyConfig.addFilter("sortDesc", (posts) => {
    posts.sort(function (a, b) {
      a = new Date(a.date);
      b = new Date(b.date);
      return a > b ? -1 : a < b ? 1 : 0;
    });
    return posts;
  });

  eleventyConfig.addFilter("bust", (url) => {
    const [urlPart, paramPart] = url.split("?");
    const params = new URLSearchParams(paramPart || "");
    const urlPrefix = __dirname + "/src/";
    const relativeUrl =
      urlPart.charAt(0) == "/"
        ? urlPrefix + urlPart.substring(1)
        : urlPrefix + urlPart;

    try {
      const fileStats = fs.statSync(relativeUrl);
      const dateTimeModified = new Date(fileStats.mtime).getTime();
      params.set("v", dateTimeModified);
    } catch (error) {
      console.log(error);
    }
    return `${urlPart}?${params}`;
  });

  // IDs in headings
  const markdownIt = require("markdown-it");

  // create a new markdown-it instance with the plugin
  const markdownLib = markdownIt({ html: true }).use(markdownItAnchor);

  // replace the default markdown-it instance
  eleventyConfig.setLibrary("md", markdownLib);

  // add plugins
  eleventyConfig.addPlugin(pluginRSS);
  eleventyConfig.addPlugin(syntaxHighlight);
  eleventyConfig.addPlugin(pluginTOC, {
    tags: ["h2", "h3"],
    wrapper: "div",
  });

  return {
    dir: {
      input: "src",
      output: "dist",
      includes: "_includes",
      data: "_data",
    },
    templateFormats: ["md", "html", "njk"],
    markdownTemplateEngine: "njk",
  };
};
