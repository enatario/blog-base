import { DateTime } from "luxon";
import { feedPlugin } from "@11ty/eleventy-plugin-rss";
import Image from '@11ty/eleventy-img';
import lightningcssPlugin from "@11tyrocks/eleventy-plugin-lightningcss";
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

  eleventyConfig.addPlugin(lightningcssPlugin, {
    src: "src/css/app.css",

    lightningcssOptions: {
      minify: true,
      sourceMap: true,
      targets: "defaults"
    }
  });

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
    async function(images, caption = "") {
      let renderedImages = [];

      for (let { src, alt, className = "" } of images) {
        let inputPath = this.page.inputPath;
        let inputDir = path.dirname(inputPath);
        let fullSrc = path.join(inputDir, src);

        // Generate optimized versions
        let metadata = await Image(fullSrc, {
          widths: [400, 800, 1200, null],
          formats: ["avif", "webp", "jpeg"],
          outputDir: "./dist/img/",
          urlPath: "/img/",
        });

        const formatKey = Object.keys(metadata)[0];
        const largest = metadata[formatKey][metadata[formatKey].length - 1];

        const isPortrait = largest.height > largest.width;
        const gridSpan = isPortrait ? "single" : "double";

        let imageAttributes = {
          alt,
          style: "height: 100%; object-fit: cover;",
          loading: "lazy",
          decoding: "async",
          sizes: "100vw",
        };

        let imageHtml = Image.generateHTML(metadata, imageAttributes);

        imageHtml = imageHtml.replace(
          "<picture",
          `<picture class="figure-block__image figure-block__image--${gridSpan} ${className}"`
        );

        renderedImages.push(imageHtml);
      }

      return `
        <figure class="figure-block">
          ${renderedImages.join("\n")}
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
