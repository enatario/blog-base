import { DateTime } from "luxon";
import { feedPlugin } from "@11ty/eleventy-plugin-rss";
import Image from '@11ty/eleventy-img';
import path from "path";

export default function(eleventyConfig) {
  eleventyConfig.addWatchTarget("./src/css/");
  eleventyConfig.addWatchTarget("./src/js/");
  eleventyConfig.addPassthroughCopy("./src/static");
  eleventyConfig.addPassthroughCopy("./src/robots.txt");

  eleventyConfig.addFilter("keys", obj => Object.keys(obj));
  eleventyConfig.addFilter("except", (arr=[]) => {
    return arr.filter(function(value) {
      return value != "all";
    }).sort();
  });

  eleventyConfig.addFilter("head", (array, n) => {
    if(!Array.isArray(array) || array.length === 0) {
      return [];
    }
    if( n < 0 ) {
      return array.slice(n);
    }
    return array.slice(0, n);
  });

  eleventyConfig.addFilter("readableDate", (dateObj) => {
    return DateTime.fromJSDate(dateObj).toLocaleString(DateTime.DATE_MED);
  });

  eleventyConfig.addFilter('htmlDateString', (dateObj) => {
    return DateTime.fromJSDate(dateObj, {zone: 'utc'}).toFormat('yyyy-LL-dd');
  });

  eleventyConfig.addFilter("filterTagList", function filterTagList(tags) {
    return (tags || []).filter(tag => ["all", "posts"].indexOf(tag) === -1);
  });

  eleventyConfig.addFilter("sortAlphabetically", strings =>
    (strings || []).sort((b, a) => b.localeCompare(a))
  );

  eleventyConfig.addPlugin(feedPlugin, {
    type: "atom", // or "rss", "json"
    outputPath: "/feed.xml",
    collection: {
      name: "posts", // iterate over `collections.posts`
      limit: 10,     // 0 means no limit
    },
    metadata: {
      language: "en",
      title: "Blog Title",
      subtitle: "This is a longer description about your blog.",
      base: "https://example.com/",
      author: {
        name: "Your Name",
        email: "", // Optional
      }
    }
  });

  eleventyConfig.addNunjucksAsyncShortcode(
    "figure",
    async function(src, alt, className = "", caption = "") {
      let inputPath = this.page.inputPath;
      let inputDir = path.dirname(inputPath);
      let fullSrc = path.join(inputDir, src);

      // Generate optimized versions
      let metadata = await Image(fullSrc, {
        widths: [20, 400, 800, 1200, null],
        formats: ["avif", "webp", "jpeg"],
        outputDir: "./dist/img/",
        urlPath: "/img/",
      });

      const smallestFormat = Object.keys(metadata)[0];
      const smallestWidth = Math.min(
        ...Object.keys(metadata[smallestFormat]).map((w) => parseInt(w))
      );
      const blurDataURL = metadata[smallestFormat][smallestWidth].source;

      // Default attributes for <img>
      let imageAttributes = {
        alt,
        loading: "lazy",
        decoding: "async",
        sizes: "100vw",
      };

      let imageHtml = Image.generateHTML(metadata, imageAttributes);

      return `
        <figure class="${className}">
          ${imageHtml}
          ${caption ? `<figcaption>${caption}</figcaption>` : ""}
        </figure>
      `;
    }
  );
  
  return {
    templateFormats: [
      "md",
      "njk"
    ],

    dir: {
      input: "src",
      output: "dist"
    },
    markdownTemplateEngine: "njk"
  }
}
