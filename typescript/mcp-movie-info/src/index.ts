#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from "@modelcontextprotocol/sdk/types.js";
import fetch from "node-fetch";

// 获取API密钥
function getApiKey(): string {
  const apiKey = process.env.MOVIE_API_KEY;
  if (!apiKey) {
    console.error("MOVIE_API_KEY 环境变量未设置");
    process.exit(1);
  }
  return apiKey;
}

const MOVIE_API_KEY = getApiKey();

// 工具定义
const MOVIE_TOOLS: Tool[] = [
  {
    name: "current_movies",
    description: "查询当前城市上映的电影",
    inputSchema: {
      type: "object",
      properties: {
        cityid: { type: "string", description: "城市ID" },
        city: { type: "string", description: "城市名称" },
        date: { type: "string", description: "日期，格式：YYYY-MM-DD" }
      },
      required: ["city"]
    },
    outputSchema: {
      type: "object",
      properties: {
        status: { type: "any", description: "状态码，0表示成功" },
        msg: { type: "string", description: "状态信息" },
        result: {
          type: "object",
          properties: {
            city: { type: "string", description: "城市名称" },
            cityid: { type: "string", description: "城市ID" },
            date: { type: "string", description: "日期" },
            list: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  movieid: { type: "string", description: "电影ID" },
                  moviename: { type: "string", description: "电影名称" },
                  pic: { type: "string", description: "电影海报图片URL" }
                }
              }
            }
          }
        }
      }
    }
  },
  {
    name: "movie_theaters",
    description: "查询电影放映的电影院",
    inputSchema: {
      type: "object",
      properties: {
        cityid: { type: "string", description: "城市ID" },
        city: { type: "string", description: "城市名称" },
        movieid: { type: "string", description: "电影ID" },
        date: { type: "string", description: "日期，格式：YYYY-MM-DD" }
      },
      required: ["city", "movieid"]
    },
    outputSchema: {
      type: "object",
      properties: {
        status: { type: "any", description: "状态码，0表示成功" },
        msg: { type: "string", description: "状态信息" },
        result: {
          type: "object",
          properties: {
            city: { type: "string", description: "城市名称" },
            cityid: { type: "string", description: "城市ID" },
            date: { type: "string", description: "日期" },
            movieid: { type: "string", description: "电影ID" },
            moviename: { type: "string", description: "电影名称" },
            list: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  theaterid: { type: "string", description: "电影院ID" },
                  theatername: { type: "string", description: "电影院名称" },
                  address: { type: "string", description: "电影院地址" }
                }
              }
            }
          }
        }
      }
    }
  },
  {
    name: "theater_movies",
    description: "查询电影院放映的电影",
    inputSchema: {
      type: "object",
      properties: {
        theaterid: { type: "string", description: "电影院ID" },
        date: { type: "string", description: "日期，格式：YYYY-MM-DD" }
      },
      required: ["theaterid"]
    },
    outputSchema: {
      type: "object",
      properties: {
        status: { type: "any", description: "状态码，0表示成功" },
        msg: { type: "string", description: "状态信息" },
        result: {
          type: "object",
          properties: {
            theaterid: { type: "string", description: "电影院ID" },
            theatername: { type: "string", description: "电影院名称" },
            address: { type: "string", description: "电影院地址" },
            date: { type: "string", description: "日期" },
            list: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  movieid: { type: "string", description: "电影ID" },
                  moviename: { type: "string", description: "电影名称" },
                  pic: { type: "string", description: "电影海报图片URL" }
                }
              }
            }
          }
        }
      }
    }
  },
  {
    name: "movie_detail",
    description: "查询电影详情",
    inputSchema: {
      type: "object",
      properties: {
        movieid: { type: "string", description: "电影ID" },
        moviename: { type: "string", description: "电影名称" }
      },
      required: ["movieid"]
    },
    outputSchema: {
      type: "object",
      properties: {
        status: { type: "any", description: "状态码，0表示成功" },
        msg: { type: "string", description: "状态信息" },
        result: {
          type: "object",
          properties: {
            movieid: { type: "string", description: "电影ID" },
            moviename: { type: "string", description: "电影名称" },
            pic: { type: "string", description: "电影海报图片URL" },
            director: { type: "string", description: "导演" },
            actor: { type: "string", description: "演员" },
            type: { type: "string", description: "电影类型" },
            area: { type: "string", description: "地区" },
            language: { type: "string", description: "语言" },
            duration: { type: "string", description: "片长" },
            score: { type: "string", description: "评分" },
            releasedate: { type: "string", description: "上映日期" },
            content: { type: "string", description: "电影简介" }
          }
        }
      }
    }
  },
  {
    name: "city_theaters",
    description: "按城市获取电影院",
    inputSchema: {
      type: "object",
      properties: {
        cityid: { type: "string", description: "城市ID" },
        city: { type: "string", description: "城市名称" },
        keyword: { type: "string", description: "关键词" }
      },
      required: ["city"]
    },
    outputSchema: {
      type: "object",
      properties: {
        status: { type: "any", description: "状态码，0表示成功" },
        msg: { type: "string", description: "状态信息" },
        result: {
          type: "object",
          properties: {
            city: { type: "string", description: "城市名称" },
            cityid: { type: "string", description: "城市ID" },
            list: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  theaterid: { type: "string", description: "电影院ID" },
                  theatername: { type: "string", description: "电影院名称" },
                  address: { type: "string", description: "电影院地址" },
                  tel: { type: "string", description: "电影院电话" }
                }
              }
            }
          }
        }
      }
    }
  },
  {
    name: "movie_cities",
    description: "获取电影城市列表",
    inputSchema: {
      type: "object",
      properties: {
        parentid: { type: "string", description: "上级ID" }
      }
    },
    outputSchema: {
      type: "object",
      properties: {
        status: { type: "any", description: "状态码，0表示成功" },
        msg: { type: "string", description: "状态信息" },
        result: {
          type: "array",
          items: {
            type: "object",
            properties: {
              cityid: { type: "string", description: "城市ID" },
              name: { type: "string", description: "城市名称" },
              parentid: { type: "string", description: "上级ID" },
              parentname: { type: "string", description: "上级名称" },
              topname: { type: "string", description: "顶级名称" },
              depth: { type: "string", description: "层级深度" }
            }
          }
        }
      }
    }
  }
];

// API请求处理函数
async function handleApiRequest(endpoint: string, params: any) {
  const url = new URL(`https://api.jisuapi.com/movie/${endpoint}`);
  Object.keys(params).forEach(key => url.searchParams.append(key, params[key]));
  url.searchParams.append('appkey', MOVIE_API_KEY);

  try {
    const response = await fetch(url.toString());
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return {
      structuredContent: data,
      content: [{
        type: "text",
        text: JSON.stringify(data, null, 2)
      }],
      isError: false
    };
  } catch (error: any) {
    console.error("API请求错误:", error);
    return {
      content: [{
        type: "text",
        text: `API请求错误: ${error.message}`
      }],
      isError: true
    };
  }
}

// 服务器设置
const server = new Server(
  {
    name: "movie-info",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  },
);

// 设置请求处理程序
server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: MOVIE_TOOLS,
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  try {
    switch (request.params.name) {
      case "current_movies":
        return await handleApiRequest('on', request.params.arguments);
      case "movie_theaters":
        return await handleApiRequest('movietheater', request.params.arguments);
      case "theater_movies":
        return await handleApiRequest('theatermovie', request.params.arguments);
      case "movie_detail":
        return await handleApiRequest('detail', request.params.arguments);
      case "city_theaters":
        return await handleApiRequest('theater', request.params.arguments);
      case "movie_cities":
        return await handleApiRequest('city', request.params.arguments);
      default:
        return {
          content: [{
            type: "text",
            text: `未知工具: ${request.params.name}`
          }],
          isError: true
        };
    }
  } catch (error) {
    return {
      content: [{
        type: "text",
        text: `错误: ${error instanceof Error ? error.message : String(error)}`
      }],
      isError: true
    };
  }
});

async function runServer() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("电影影讯 MCP 服务器正在通过 stdio 运行");
}

runServer().catch((error) => {
  console.error("运行服务器时发生致命错误:", error);
  process.exit(1);
});
