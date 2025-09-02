import FirecrawlApp from '@mendable/firecrawl-js'

export class FirecrawlService {
  private client: FirecrawlApp
  
  constructor(apiKey?: string) {
    this.client = new FirecrawlApp({
      apiKey: apiKey || process.env.FIRECRAWL_API_KEY!
    })
  }
  
  async scrapeUrl(url: string) {
    try {
      const result = await this.client.scrapeUrl(url, {
        pageOptions: {
          includeHtml: false,
          screenshot: true,
          waitFor: 2000,
        }
      })
      
      return {
        success: true,
        data: {
          title: result.data?.title,
          content: result.data?.markdown,
          screenshot: result.data?.screenshot,
          metadata: result.data?.metadata,
          url: url
        }
      }
    } catch (error) {
      console.error('Firecrawl scrape error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to scrape URL'
      }
    }
  }
  
  async search(query: string, limit: number = 10) {
    try {
      const results = await this.client.search(query, {
        limit,
        scrapeOptions: {
          formats: ['markdown', 'screenshot']
        }
      })
      
      return {
        success: true,
        data: results.data?.map((item: any) => ({
          title: item.title,
          url: item.url,
          content: item.markdown,
          screenshot: item.screenshot,
          score: item.score
        })) || []
      }
    } catch (error) {
      console.error('Firecrawl search error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Search failed'
      }
    }
  }
  
  async crawlSite(url: string, maxPages: number = 10) {
    try {
      const crawlUrl = await this.client.crawlUrl(url, {
        crawlerOptions: {
          limit: maxPages,
          includes: [],
          excludes: []
        },
        pageOptions: {
          includeHtml: false,
          screenshot: false
        }
      })
      
      // Poll for completion
      let result
      while (true) {
        result = await this.client.checkCrawlStatus(crawlUrl.jobId!)
        if (result.status === 'completed') {
          break
        }
        await new Promise(resolve => setTimeout(resolve, 2000))
      }
      
      return {
        success: true,
        data: result.data?.map((page: any) => ({
          url: page.url,
          title: page.title,
          content: page.markdown,
          metadata: page.metadata
        })) || []
      }
    } catch (error) {
      console.error('Firecrawl crawl error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Crawl failed'
      }
    }
  }
}
