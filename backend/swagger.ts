import swaggerJSDoc from 'swagger-jsdoc';

const publicApiUrl = process.env.PUBLIC_API_URL ?? 'http://localhost:3001';

export const openApiSpec = swaggerJSDoc({
  definition: {
    openapi: '3.0.3',
    info: {
      title: 'Todo API',
      version: '1.0.0',
      description:
        'Full-stack Todo backend API with JWT auth (HTTP-only cookies), RBAC and profile avatar upload.',
    },
    servers: [
      {
        url: publicApiUrl,
        description: 'Public backend URL',
      },
    ],
    tags: [
      { name: 'Health', description: 'Service status' },
      { name: 'Auth', description: 'Authentication and session endpoints' },
      { name: 'Todos', description: 'Todo CRUD endpoints' },
      { name: 'Profile', description: 'Current user profile endpoints' },
      { name: 'Admin', description: 'Admin and superadmin endpoints' },
    ],
    components: {
      securitySchemes: {
        accessTokenCookie: {
          type: 'apiKey',
          in: 'cookie',
          name: 'access_token',
        },
      },
      schemas: {
        ApiError: {
          type: 'object',
          properties: {
            error: { type: 'string', example: 'Unauthorized' },
          },
          required: ['error'],
        },
        User: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 1 },
            email: { type: 'string', format: 'email', example: 'user@example.com' },
            name: { type: 'string', nullable: true, example: 'Alex' },
            bio: { type: 'string', nullable: true, example: 'Frontend dev learning backend' },
            avatar_url: { type: 'string', nullable: true, example: '/uploads/avatars/user-1.jpg' },
            role: { type: 'string', enum: ['user', 'admin', 'superadmin'], example: 'user' },
          },
          required: ['id', 'email'],
        },
        Todo: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 42 },
            title: { type: 'string', example: 'Prepare deploy docs' },
            description: { type: 'string', example: 'Write production deployment instructions' },
            completed: { type: 'boolean', example: false },
            createdAt: { type: 'string', format: 'date-time' },
            tags: {
              type: 'array',
              items: { type: 'string' },
              example: ['docs', 'deploy'],
            },
            deadline: { type: 'string', format: 'date', nullable: true, example: '2026-03-15' },
          },
          required: ['id', 'title', 'description', 'completed', 'createdAt', 'tags'],
        },
        TodosPage: {
          type: 'object',
          properties: {
            items: {
              type: 'array',
              items: { $ref: '#/components/schemas/Todo' },
            },
            page: { type: 'integer', example: 0 },
            page_size: { type: 'integer', example: 5 },
            total: { type: 'integer', example: 18 },
            total_pages: { type: 'integer', example: 4 },
            has_previous: { type: 'boolean', example: false },
            has_next: { type: 'boolean', example: true },
          },
          required: ['items', 'page', 'page_size', 'total', 'total_pages', 'has_previous', 'has_next'],
        },
      },
    },
    paths: {
      '/': {
        get: {
          tags: ['Health'],
          summary: 'Health check',
          responses: {
            '200': {
              description: 'Service is alive',
            },
          },
        },
      },
      '/api/auth/register': {
        post: {
          tags: ['Auth'],
          summary: 'Register a new user',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['email', 'password'],
                  properties: {
                    email: { type: 'string', format: 'email' },
                    password: { type: 'string', minLength: 6 },
                  },
                },
              },
            },
          },
          responses: {
            '201': {
              description: 'User created, cookies are set',
              headers: {
                'Set-Cookie': {
                  schema: { type: 'string' },
                },
              },
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/User' },
                },
              },
            },
            '409': {
              description: 'User already exists',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ApiError' },
                },
              },
            },
          },
        },
      },
      '/api/auth/login': {
        post: {
          tags: ['Auth'],
          summary: 'Login by email/password',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['email', 'password'],
                  properties: {
                    email: { type: 'string', format: 'email' },
                    password: { type: 'string', minLength: 6 },
                  },
                },
              },
            },
          },
          responses: {
            '200': {
              description: 'Authorized user profile',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/User' },
                },
              },
            },
            '401': {
              description: 'Invalid credentials',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ApiError' },
                },
              },
            },
          },
        },
      },
      '/api/auth/logout': {
        post: {
          tags: ['Auth'],
          summary: 'Logout current user',
          responses: {
            '200': {
              description: 'Cookies are cleared',
            },
          },
        },
      },
      '/api/auth/me': {
        get: {
          tags: ['Auth'],
          summary: 'Get current user profile',
          security: [{ accessTokenCookie: [] }],
          responses: {
            '200': {
              description: 'Current user',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/User' },
                },
              },
            },
            '401': {
              description: 'Unauthorized',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ApiError' },
                },
              },
            },
          },
        },
      },
      '/api/todos': {
        get: {
          tags: ['Todos'],
          summary: 'Get todos with filters and pagination',
          security: [{ accessTokenCookie: [] }],
          parameters: [
            {
              name: 'filter',
              in: 'query',
              schema: { type: 'string', enum: ['all', 'active', 'completed'] },
              required: false,
            },
            { name: 'q', in: 'query', schema: { type: 'string' }, required: false },
            { name: 'page', in: 'query', schema: { type: 'integer', minimum: 0 }, required: false },
            { name: 'page_size', in: 'query', schema: { type: 'integer', minimum: 1, maximum: 100 }, required: false },
          ],
          responses: {
            '200': {
              description: 'Paginated todo list',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/TodosPage' },
                },
              },
            },
          },
        },
        post: {
          tags: ['Todos'],
          summary: 'Create new todo',
          security: [{ accessTokenCookie: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['title'],
                  properties: {
                    title: { type: 'string', maxLength: 120 },
                    description: { type: 'string', maxLength: 500 },
                    tags: { type: 'array', items: { type: 'string' } },
                    deadline: { type: 'string', format: 'date', nullable: true },
                  },
                },
              },
            },
          },
          responses: {
            '201': {
              description: 'Created todo',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Todo' },
                },
              },
            },
          },
        },
      },
      '/api/profile': {
        get: {
          tags: ['Profile'],
          summary: 'Get current profile',
          security: [{ accessTokenCookie: [] }],
          responses: {
            '200': {
              description: 'Current profile',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/User' },
                },
              },
            },
          },
        },
        put: {
          tags: ['Profile'],
          summary: 'Update current profile',
          security: [{ accessTokenCookie: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    name: { type: 'string', maxLength: 100 },
                    bio: { type: 'string', maxLength: 500 },
                  },
                },
              },
            },
          },
          responses: {
            '200': {
              description: 'Updated user profile',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/User' },
                },
              },
            },
          },
        },
      },
      '/api/profile/avatar': {
        post: {
          tags: ['Profile'],
          summary: 'Upload avatar image',
          security: [{ accessTokenCookie: [] }],
          requestBody: {
            required: true,
            content: {
              'multipart/form-data': {
                schema: {
                  type: 'object',
                  required: ['avatar'],
                  properties: {
                    avatar: {
                      type: 'string',
                      format: 'binary',
                    },
                  },
                },
              },
            },
          },
          responses: {
            '200': {
              description: 'Profile with new avatar URL',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/User' },
                },
              },
            },
          },
        },
        delete: {
          tags: ['Profile'],
          summary: 'Delete current avatar',
          security: [{ accessTokenCookie: [] }],
          responses: {
            '200': {
              description: 'Profile without avatar',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/User' },
                },
              },
            },
          },
        },
      },
      '/api/admin/users': {
        get: {
          tags: ['Admin'],
          summary: 'Get users list (admin/superadmin)',
          security: [{ accessTokenCookie: [] }],
          responses: {
            '200': {
              description: 'Users list',
            },
            '403': {
              description: 'Forbidden',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ApiError' },
                },
              },
            },
          },
        },
      },
      '/api/admin/boot-superadmin': {
        post: {
          tags: ['Admin'],
          summary: 'Bootstrap first superadmin by secret',
          parameters: [
            {
              name: 'x-bootstrap-secret',
              in: 'header',
              required: true,
              schema: { type: 'string' },
            },
          ],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['email'],
                  properties: {
                    email: { type: 'string', format: 'email' },
                  },
                },
              },
            },
          },
          responses: {
            '200': {
              description: 'Superadmin assigned',
            },
            '401': {
              description: 'Invalid bootstrap secret',
            },
          },
        },
      },
    },
  },
  apis: [],
});
