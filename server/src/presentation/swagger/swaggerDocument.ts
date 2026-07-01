import type { OpenAPIV3 } from 'openapi-types'

const swaggerDocument: OpenAPIV3.Document = {
  openapi: '3.0.0',
  info: {
    title: 'HomeFix API',
    version: '1.0.0',
    description: 'API documentation for HomeFix platform - Connecting clients with home service workers.',
    contact: {
      name: 'HomeFix Team',
    },
  },
  servers: [
    {
      url: '/',
      description: 'Current server',
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Auth0 JWT token. Obtain via /auth/login or /auth/register.',
      },
    },
    schemas: {
      Error: {
        type: 'object',
        properties: {
          error: {
            type: 'string',
            description: 'Error message',
          },
        },
        required: ['error'],
      },
      User: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          email: { type: 'string', format: 'email' },
          role: { type: 'string', enum: ['client', 'worker', 'admin'] },
          photo: { type: 'string', nullable: true },
        },
      },
      RegisterRequest: {
        type: 'object',
        required: ['name', 'email', 'password'],
        properties: {
          name: { type: 'string', example: 'Juan Pérez' },
          email: { type: 'string', format: 'email', example: 'juan@example.com' },
          password: { type: 'string', format: 'password', example: 'SecurePass123!' },
        },
      },
      RegisterWorkerRequest: {
        type: 'object',
        required: ['name', 'email', 'password'],
        properties: {
          name: { type: 'string', example: 'Carlos García' },
          email: { type: 'string', format: 'email', example: 'carlos@example.com' },
          password: { type: 'string', format: 'password', example: 'SecurePass123!' },
        },
      },
      LoginRequest: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', format: 'email', example: 'juan@example.com' },
          password: { type: 'string', format: 'password', example: 'SecurePass123!' },
        },
      },
      ResendVerificationRequest: {
        type: 'object',
        required: ['email'],
        properties: {
          email: { type: 'string', format: 'email', example: 'juan@example.com' },
        },
      },
      ForgotPasswordRequest: {
        type: 'object',
        required: ['email'],
        properties: {
          email: { type: 'string', format: 'email', example: 'juan@example.com' },
        },
      },
      SuccessMessage: {
        type: 'object',
        properties: {
          message: { type: 'string', example: 'Operación exitosa' },
        },
      },
      Post: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          title: { type: 'string' },
          description: { type: 'string' },
          category: { type: 'string' },
          status: { type: 'string', enum: ['available', 'in_progress', 'completed', 'cancelled', 'paused', 'finalized'] },
          urgency: { type: 'string', enum: ['low', 'medium', 'high', 'emergency'] },
          userId: { type: 'string' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
          images: { type: 'array', items: { type: 'string' } },
          location: {
            type: 'object',
            properties: {
              lat: { type: 'number' },
              lng: { type: 'number' },
              address: { type: 'string' },
            },
          },
        },
      },
      CreatePostRequest: {
        type: 'object',
        required: ['title', 'description', 'category'],
        properties: {
          title: { type: 'string', example: 'Reparación de plomería' },
          description: { type: 'string', example: 'Tengo una tubería rota en el baño' },
          category: { type: 'string', example: 'plomeria' },
          urgency: { type: 'string', enum: ['low', 'medium', 'high', 'emergency'], default: 'medium' },
          location: {
            type: 'object',
            properties: {
              lat: { type: 'number', example: -34.6037 },
              lng: { type: 'number', example: -58.3816 },
              address: { type: 'string', example: 'Av. Corrientes 1234, Buenos Aires' },
            },
          },
          images: { type: 'array', items: { type: 'string' } },
        },
      },
      UpdatePostRequest: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          description: { type: 'string' },
          category: { type: 'string' },
          urgency: { type: 'string', enum: ['low', 'medium', 'high', 'emergency'] },
          images: { type: 'array', items: { type: 'string' } },
        },
      },
      CreateSubcontractRequest: {
        type: 'object',
        required: ['title', 'description', 'category', 'startDate', 'endDate'],
        properties: {
          title: { type: 'string', example: 'Remodelación completa de baño' },
          description: { type: 'string', example: 'Remodelación completa incluyendo plomería, electricidad y acabados' },
          category: { type: 'string', example: 'remodelacion' },
          startDate: { type: 'string', format: 'date', example: '2025-02-01' },
          endDate: { type: 'string', format: 'date', example: '2025-02-15' },
          location: {
            type: 'object',
            properties: {
              lat: { type: 'number' },
              lng: { type: 'number' },
              address: { type: 'string' },
            },
          },
          subcategories: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                category: { type: 'string' },
                description: { type: 'string' },
                quantity: { type: 'integer' },
              },
            },
          },
        },
      },
      Worker: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          email: { type: 'string', format: 'email' },
          photo: { type: 'string', nullable: true },
          categories: { type: 'array', items: { type: 'string' } },
          rating: { type: 'number', nullable: true },
          reviewCount: { type: 'integer' },
          description: { type: 'string', nullable: true },
          hourlyRate: { type: 'number', nullable: true },
        },
      },
      UpdateWorkerRequest: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          photo: { type: 'string' },
          categories: { type: 'array', items: { type: 'string' } },
          description: { type: 'string' },
          hourlyRate: { type: 'number' },
        },
      },
      WorkerReview: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          rating: { type: 'integer', minimum: 1, maximum: 5 },
          comment: { type: 'string', nullable: true },
          reviewerName: { type: 'string' },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
      Application: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          postId: { type: 'string' },
          workerId: { type: 'string' },
          status: { type: 'string', enum: ['pending', 'accepted', 'rejected', 'completed', 'cancelled'] },
          message: { type: 'string', nullable: true },
          availableDays: { type: 'array', items: { type: 'string' } },
          availableTimeFrom: { type: 'string' },
          availableTimeTo: { type: 'string' },
          chargesVisit: { type: 'boolean' },
          visitCost: { type: 'number', nullable: true },
        },
      },
      CreateApplicationRequest: {
        type: 'object',
        required: ['postId', 'availableDays', 'availableTimeFrom', 'availableTimeTo', 'chargesVisit'],
        properties: {
          postId: { type: 'string', description: 'ID del post al que se aplica' },
          message: { type: 'string', description: 'Mensaje opcional para el cliente' },
          availableDays: { type: 'array', items: { type: 'string' }, example: ['lunes', 'martes', 'miercoles'] },
          availableTimeFrom: { type: 'string', example: '09:00' },
          availableTimeTo: { type: 'string', example: '18:00' },
          chargesVisit: { type: 'boolean', description: 'Si el trabajador cobra por la visita' },
          visitCost: { type: 'number', description: 'Costo de la visita si chargesVisit es true' },
        },
      },
      CreateSubcontractApplicationRequest: {
        type: 'object',
        required: ['postId', 'categoryId'],
        properties: {
          postId: { type: 'string' },
          categoryId: { type: 'string' },
          message: { type: 'string' },
          availableDays: { type: 'array', items: { type: 'string' } },
          availableTimeFrom: { type: 'string' },
          availableTimeTo: { type: 'string' },
          chargesVisit: { type: 'boolean' },
          visitCost: { type: 'number' },
        },
      },
      Review: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          postId: { type: 'string' },
          reviewerId: { type: 'string' },
          rating: { type: 'integer', minimum: 1, maximum: 5 },
          comment: { type: 'string', nullable: true },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
      CreateWorkerReviewRequest: {
        type: 'object',
        required: ['postId', 'rating'],
        properties: {
          postId: { type: 'string' },
          rating: { type: 'integer', minimum: 1, maximum: 5 },
          comment: { type: 'string' },
        },
      },
      CreateClientReviewRequest: {
        type: 'object',
        required: ['applicationId', 'rating'],
        properties: {
          applicationId: { type: 'string' },
          rating: { type: 'integer', minimum: 1, maximum: 5 },
          comment: { type: 'string' },
        },
      },
      Category: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          slug: { type: 'string' },
        },
      },
      KycSessionResponse: {
        type: 'object',
        properties: {
          sessionUrl: { type: 'string', format: 'uri' },
          sessionId: { type: 'string' },
        },
      },
      KycConfirmRequest: {
        type: 'object',
        required: ['sessionId', 'email'],
        properties: {
          sessionId: { type: 'string' },
          email: { type: 'string', format: 'email' },
          status: { type: 'string' },
        },
      },
      KycStatusResponse: {
        type: 'object',
        properties: {
          status: { type: 'string', enum: ['pending', 'approved', 'rejected', 'not_started'] },
        },
      },
      KycDecisionResponse: {
        type: 'object',
        properties: {
          decision: { type: 'string', enum: ['approved', 'rejected', 'pending'] },
          reason: { type: 'string', nullable: true },
        },
      },
      KycWebhookRequest: {
        type: 'object',
        properties: {
          event: { type: 'string' },
          sessionId: { type: 'string' },
          status: { type: 'string' },
        },
      },
      TelegramLinkResponse: {
        type: 'object',
        properties: {
          code: { type: 'string' },
          deepLink: { type: 'string', format: 'uri' },
          message: { type: 'string' },
        },
      },
      TelegramStatusResponse: {
        type: 'object',
        properties: {
          linked: { type: 'boolean' },
          linkedAt: { type: 'string', format: 'date-time', nullable: true },
        },
      },
      ClientStatsResponse: {
        type: 'object',
        properties: {
          completedPosts: { type: 'integer' },
          cancelledPosts: { type: 'integer' },
          unreviewedJobs: { type: 'integer' },
          clientRating: { type: 'number', nullable: true },
        },
      },
      ClientProfile: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          surname: { type: 'string', nullable: true },
          phone: { type: 'string', nullable: true },
          email: { type: 'string' },
          bio: { type: 'string', nullable: true },
          photo: { type: 'string', nullable: true },
        },
      },
      UpdateClientProfileRequest: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          surname: { type: 'string' },
          phone: { type: 'string' },
          bio: { type: 'string' },
          photo: { type: 'string' },
        },
      },
      WorkerDashboard: {
        type: 'object',
        properties: {
          activeJobs: { type: 'integer' },
          pendingApplications: { type: 'integer' },
          completedJobs: { type: 'integer' },
          earnings: { type: 'number' },
          recentActivity: { type: 'array', items: { type: 'object' } },
        },
      },
      SuggestPostRequest: {
        type: 'object',
        required: ['description'],
        properties: {
          description: { type: 'string', description: 'Descripción del problema o servicio necesario', example: 'Tengo una filtración de agua en el techo del baño' },
        },
      },
      SuggestPostResponse: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          category: { type: 'string' },
          urgency: { type: 'string' },
          suggestedDescription: { type: 'string' },
        },
      },
      UserListItem: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          email: { type: 'string', format: 'email' },
          role: { type: 'string', enum: ['client', 'worker', 'admin'] },
          photo: { type: 'string', nullable: true },
        },
      },
      UserReview: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          rating: { type: 'integer', minimum: 1, maximum: 5 },
          comment: { type: 'string', nullable: true },
          createdAt: { type: 'string', format: 'date-time' },
          reviewer: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
              photo: { type: 'string', nullable: true },
            },
          },
        },
      },
      UserRating: {
        type: 'object',
        properties: {
          averageRating: { type: 'number', nullable: true },
          totalReviews: { type: 'integer' },
        },
      },
      EmergencyNotificationRequest: {
        type: 'object',
        required: ['enabled'],
        properties: {
          enabled: { type: 'boolean', description: 'Enable or disable emergency notifications' },
        },
      },
      UploadResponse: {
        type: 'object',
        properties: {
          urls: { type: 'array', items: { type: 'string', format: 'uri' } },
        },
      },
    },
  },
  paths: {
    '/health': {
      get: {
        tags: ['Health'],
        summary: 'Health check endpoint',
        description: 'Returns the health status of the API server.',
        responses: {
          '200': {
            description: 'Server is healthy',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: { type: 'string', example: 'ok' },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/auth/register': {
      post: {
        tags: ['Auth'],
        summary: 'Register a new client user',
        description: 'Creates a new client account in the system. No authentication required.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/RegisterRequest' },
            },
          },
        },
        responses: {
          '201': {
            description: 'User registered successfully',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/User' },
              },
            },
          },
          '400': {
            description: 'Validation error - missing required fields',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
                examples: {
                  missingName: {
                    summary: 'Missing name',
                    value: { error: 'El nombre es obligatorio' },
                  },
                  missingEmail: {
                    summary: 'Missing email',
                    value: { error: 'El correo electrónico es obligatorio' },
                  },
                  missingPassword: {
                    summary: 'Missing password',
                    value: { error: 'La contraseña es obligatoria' },
                  },
                },
              },
            },
          },
          '500': {
            description: 'Internal server error',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
        },
      },
    },
    '/auth/register/worker': {
      post: {
        tags: ['Auth'],
        summary: 'Register a new worker user',
        description: 'Creates a new worker account in the system. No authentication required.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/RegisterWorkerRequest' },
            },
          },
        },
        responses: {
          '201': {
            description: 'Worker registered successfully',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/User' },
              },
            },
          },
          '400': {
            description: 'Validation error - missing required fields',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
                examples: {
                  missingName: {
                    summary: 'Missing name',
                    value: { error: 'El nombre es obligatorio' },
                  },
                  missingEmail: {
                    summary: 'Missing email',
                    value: { error: 'El correo electrónico es obligatorio' },
                  },
                  missingPassword: {
                    summary: 'Missing password',
                    value: { error: 'La contraseña es obligatoria' },
                  },
                },
              },
            },
          },
          '500': {
            description: 'Internal server error',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
        },
      },
    },
    '/auth/resend-verification': {
      post: {
        tags: ['Auth'],
        summary: 'Resend verification email',
        description: 'Sends a new verification email to the specified address.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ResendVerificationRequest' },
            },
          },
        },
        responses: {
          '200': {
            description: 'Verification email sent',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/SuccessMessage' },
              },
            },
          },
          '400': {
            description: 'Invalid or missing email',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
          '500': {
            description: 'Internal server error',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
        },
      },
    },
    '/auth/forgot-password': {
      post: {
        tags: ['Auth'],
        summary: 'Send password reset email',
        description: 'Sends a password reset link to the specified email address.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ForgotPasswordRequest' },
            },
          },
        },
        responses: {
          '200': {
            description: 'Password reset email sent',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/SuccessMessage' },
              },
            },
          },
          '400': {
            description: 'Invalid or missing email',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
          '500': {
            description: 'Internal server error',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
        },
      },
    },
    '/auth/login': {
      post: {
        tags: ['Auth'],
        summary: 'Login user',
        description: 'Authenticates a user and returns a JWT token.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/LoginRequest' },
            },
          },
        },
        responses: {
          '200': {
            description: 'Login successful',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    token: { type: 'string', description: 'JWT access token' },
                    user: { $ref: '#/components/schemas/User' },
                  },
                },
              },
            },
          },
          '400': {
            description: 'Invalid credentials',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
          '401': {
            description: 'Unauthorized - invalid email or password',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
          '500': {
            description: 'Internal server error',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
        },
      },
    },
    '/auth/me': {
      get: {
        tags: ['Auth'],
        summary: 'Get current user profile',
        description: 'Returns the authenticated user profile. Syncs user data with Auth0.',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            in: 'header',
            name: 'x-auth-source',
            required: false,
            schema: { type: 'string' },
            description: 'Set to "register" if this is a first-time login after registration',
          },
        ],
        responses: {
          '200': {
            description: 'User profile returned',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/User' },
              },
            },
          },
          '400': {
            description: 'Bad request - invalid token or missing claims',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
          '401': {
            description: 'Unauthorized - missing or invalid JWT token',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
        },
      },
    },
    '/posts/': {
      get: {
        tags: ['Posts'],
        summary: 'List available posts',
        description: 'Returns paginated list of available posts. Worker role required.',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            in: 'query',
            name: 'page',
            schema: { type: 'integer', default: 1, minimum: 1 },
            description: 'Page number',
          },
          {
            in: 'query',
            name: 'limit',
            schema: { type: 'integer', default: 10, minimum: 1, maximum: 100 },
            description: 'Items per page',
          },
          {
            in: 'query',
            name: 'sortOrder',
            schema: { type: 'string', enum: ['asc', 'desc'], default: 'desc' },
            description: 'Sort order by creation date',
          },
        ],
        responses: {
          '200': {
            description: 'Paginated list of posts',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    data: { type: 'array', items: { $ref: '#/components/schemas/Post' } },
                    total: { type: 'integer' },
                    page: { type: 'integer' },
                    limit: { type: 'integer' },
                  },
                },
              },
            },
          },
          '403': {
            description: 'Forbidden - worker access required',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
                example: { error: 'Worker access required' },
              },
            },
          },
          '400': {
            description: 'Bad request',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
        },
      },
    },
    '/posts/available': {
      get: {
        tags: ['Posts'],
        summary: 'List available posts by category',
        description: 'Returns paginated list of available posts filtered by category. Worker role required.',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            in: 'query',
            name: 'category',
            schema: { type: 'string' },
            description: 'Filter by category slug',
          },
          {
            in: 'query',
            name: 'page',
            schema: { type: 'integer', default: 1, minimum: 1 },
            description: 'Page number',
          },
          {
            in: 'query',
            name: 'limit',
            schema: { type: 'integer', default: 10, minimum: 1, maximum: 100 },
            description: 'Items per page',
          },
          {
            in: 'query',
            name: 'sortOrder',
            schema: { type: 'string', enum: ['asc', 'desc'], default: 'desc' },
            description: 'Sort order',
          },
        ],
        responses: {
          '200': {
            description: 'Paginated list of available posts',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    data: { type: 'array', items: { $ref: '#/components/schemas/Post' } },
                    total: { type: 'integer' },
                    page: { type: 'integer' },
                    limit: { type: 'integer' },
                  },
                },
              },
            },
          },
          '403': {
            description: 'Forbidden - worker access required',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
          '400': {
            description: 'Bad request',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
        },
      },
    },
    '/posts/emergency': {
      get: {
        tags: ['Posts'],
        summary: 'List emergency posts',
        description: 'Returns all emergency posts. Worker role required.',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            in: 'query',
            name: 'category',
            schema: { type: 'string' },
            description: 'Filter by category slug',
          },
        ],
        responses: {
          '200': {
            description: 'List of emergency posts',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/Post' },
                },
              },
            },
          },
          '403': {
            description: 'Forbidden - worker access required',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
          '400': {
            description: 'Bad request',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
        },
      },
    },
    '/posts/search-location': {
      get: {
        tags: ['Posts'],
        summary: 'Search posts by distance',
        description: 'Returns posts within a specified radius from a location. Worker role required.',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            in: 'query',
            name: 'lat',
            required: true,
            schema: { type: 'number' },
            description: 'Latitude',
          },
          {
            in: 'query',
            name: 'lng',
            required: true,
            schema: { type: 'number' },
            description: 'Longitude',
          },
          {
            in: 'query',
            name: 'radius',
            required: true,
            schema: { type: 'number' },
            description: 'Search radius in kilometers',
          },
          {
            in: 'query',
            name: 'category',
            schema: { type: 'string' },
            description: 'Filter by category slug',
          },
        ],
        responses: {
          '200': {
            description: 'List of posts within radius',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/Post' },
                },
              },
            },
          },
          '403': {
            description: 'Forbidden - worker access required',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
          '400': {
            description: 'Bad request - invalid coordinates',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
        },
      },
    },
    '/posts/availableSubcontracts': {
      get: {
        tags: ['Posts'],
        summary: 'List available subcontracts',
        description: 'Returns all available subcontracts for workers. Worker role required.',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': {
            description: 'List of available subcontracts',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/Post' },
                },
              },
            },
          },
          '403': {
            description: 'Forbidden - worker access required',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
          '400': {
            description: 'Bad request',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
        },
      },
    },
    '/posts/subcontracts/my-subcontracts': {
      get: {
        tags: ['Posts'],
        summary: 'Get my subcontracts as manager',
        description: 'Returns subcontracts where the authenticated user is the manager. Worker role required.',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': {
            description: 'My subcontracts with stats',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    stats: { type: 'object' },
                    subcontracts: { type: 'array', items: { $ref: '#/components/schemas/Post' } },
                  },
                },
              },
            },
          },
          '403': {
            description: 'Forbidden - worker access required',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
          '400': {
            description: 'Bad request',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
        },
      },
    },
    '/posts/subcontracts/group/{id}': {
      get: {
        tags: ['Posts'],
        summary: 'Get subcontract group detail',
        description: 'Returns detailed information about a subcontract group. Worker role required.',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            in: 'path',
            name: 'id',
            required: true,
            schema: { type: 'string' },
            description: 'Subcontract group ID',
          },
        ],
        responses: {
          '200': {
            description: 'Subcontract group details',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Post' },
              },
            },
          },
          '403': {
            description: 'Forbidden - worker access required',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
          '404': {
            description: 'Not found - subcontract group does not exist',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
                example: { error: 'Subcontract group not found' },
              },
            },
          },
          '400': {
            description: 'Bad request',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
        },
      },
    },
    '/posts/subcontracts/{id}': {
      get: {
        tags: ['Posts'],
        summary: 'Get subcontract by ID',
        description: 'Returns a specific subcontract. Worker role required.',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            in: 'path',
            name: 'id',
            required: true,
            schema: { type: 'string' },
            description: 'Subcontract ID',
          },
        ],
        responses: {
          '200': {
            description: 'Subcontract details',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Post' },
              },
            },
          },
          '403': {
            description: 'Forbidden - worker access required',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
          '404': {
            description: 'Not found - subcontract does not exist',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
                example: { error: 'Subcontract not found' },
              },
            },
          },
          '400': {
            description: 'Bad request',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
        },
      },
    },
    '/posts/create': {
      post: {
        tags: ['Posts'],
        summary: 'Create a new post',
        description: 'Creates a new service post. Requires authentication.',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/CreatePostRequest' },
            },
          },
        },
        responses: {
          '201': {
            description: 'Post created successfully',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Post' },
              },
            },
          },
          '400': {
            description: 'Bad request - invalid input',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
          '401': {
            description: 'Unauthorized - missing or invalid token',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
        },
      },
    },
    '/posts/create-subcontract': {
      post: {
        tags: ['Posts'],
        summary: 'Create a subcontract',
        description: 'Creates a new subcontract with multiple subcategories. Requires authentication.',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/CreateSubcontractRequest' },
            },
          },
        },
        responses: {
          '201': {
            description: 'Subcontract created successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/Post' },
                },
              },
            },
          },
          '400': {
            description: 'Bad request - invalid input',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
          '401': {
            description: 'Unauthorized - missing or invalid token',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
        },
      },
    },
    '/posts/{id}': {
      get: {
        tags: ['Posts'],
        summary: 'Get post by ID',
        description: 'Returns a specific post by its ID.',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            in: 'path',
            name: 'id',
            required: true,
            schema: { type: 'string' },
            description: 'Post ID',
          },
        ],
        responses: {
          '200': {
            description: 'Post details',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Post' },
              },
            },
          },
          '404': {
            description: 'Not found - post does not exist',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
                example: { error: 'Post not found' },
              },
            },
          },
          '400': {
            description: 'Bad request',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
        },
      },
      patch: {
        tags: ['Posts'],
        summary: 'Update a post',
        description: 'Updates an existing post. Only the owner can update.',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            in: 'path',
            name: 'id',
            required: true,
            schema: { type: 'string' },
            description: 'Post ID',
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/UpdatePostRequest' },
            },
          },
        },
        responses: {
          '200': {
            description: 'Post updated successfully',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Post' },
              },
            },
          },
          '400': {
            description: 'Bad request - invalid input',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
          '401': {
            description: 'Unauthorized - missing token',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
        },
      },
    },
    '/posts/user-posts': {
      post: {
        tags: ['Posts'],
        summary: 'Get current user posts',
        description: 'Returns all posts created by the authenticated user.',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': {
            description: 'List of user posts',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/Post' },
                },
              },
            },
          },
          '400': {
            description: 'Bad request',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
        },
      },
    },
    '/posts/{id}/pause': {
      patch: {
        tags: ['Posts'],
        summary: 'Pause a post',
        description: 'Pauses an active post. Only the owner can pause.',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            in: 'path',
            name: 'id',
            required: true,
            schema: { type: 'string' },
            description: 'Post ID',
          },
        ],
        responses: {
          '200': {
            description: 'Post paused successfully',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Post' },
              },
            },
          },
          '400': {
            description: 'Bad request - cannot pause this post',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
          '401': {
            description: 'Unauthorized',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
        },
      },
    },
    '/posts/{id}/cancel': {
      patch: {
        tags: ['Posts'],
        summary: 'Cancel a post',
        description: 'Cancels an active post. Only the owner can cancel.',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            in: 'path',
            name: 'id',
            required: true,
            schema: { type: 'string' },
            description: 'Post ID',
          },
        ],
        responses: {
          '200': {
            description: 'Post cancelled successfully',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Post' },
              },
            },
          },
          '400': {
            description: 'Bad request - cannot cancel this post',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
          '401': {
            description: 'Unauthorized',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
        },
      },
    },
    '/posts/{id}/finalize': {
      patch: {
        tags: ['Posts'],
        summary: 'Finalize a post',
        description: 'Marks a post as finalized. Only the owner can finalize.',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            in: 'path',
            name: 'id',
            required: true,
            schema: { type: 'string' },
            description: 'Post ID',
          },
        ],
        responses: {
          '200': {
            description: 'Post finalized successfully',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Post' },
              },
            },
          },
          '400': {
            description: 'Bad request - cannot finalize this post',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
          '401': {
            description: 'Unauthorized',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
        },
      },
    },
    '/posts/{id}/complete': {
      patch: {
        tags: ['Posts'],
        summary: 'Complete a post',
        description: 'Marks a post as completed. Only the owner can complete.',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            in: 'path',
            name: 'id',
            required: true,
            schema: { type: 'string' },
            description: 'Post ID',
          },
        ],
        responses: {
          '200': {
            description: 'Post completed successfully',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Post' },
              },
            },
          },
          '400': {
            description: 'Bad request - cannot complete this post',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
          '401': {
            description: 'Unauthorized',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
        },
      },
    },
    '/posts/{id}/reopen': {
      patch: {
        tags: ['Posts'],
        summary: 'Reopen a post',
        description: 'Reopens a finalized or completed post. Only the owner can reopen.',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            in: 'path',
            name: 'id',
            required: true,
            schema: { type: 'string' },
            description: 'Post ID',
          },
        ],
        responses: {
          '200': {
            description: 'Post reopened successfully',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Post' },
              },
            },
          },
          '400': {
            description: 'Bad request - cannot reopen this post',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
          '401': {
            description: 'Unauthorized',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
        },
      },
    },
    '/posts/{id}/mark-in-progress': {
      patch: {
        tags: ['Posts'],
        summary: 'Mark post as in progress',
        description: 'Marks a post as in progress. Only the owner can perform this action.',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            in: 'path',
            name: 'id',
            required: true,
            schema: { type: 'string' },
            description: 'Post ID',
          },
        ],
        responses: {
          '200': {
            description: 'Post marked as in progress',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Post' },
              },
            },
          },
          '400': {
            description: 'Bad request - cannot mark this post as in progress',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
          '401': {
            description: 'Unauthorized',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
        },
      },
    },
    '/workers/': {
      get: {
        tags: ['Workers'],
        summary: 'List all workers',
        description: 'Returns a list of all registered workers.',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': {
            description: 'List of workers',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/Worker' },
                },
              },
            },
          },
          '400': {
            description: 'Bad request',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
        },
      },
    },
    '/workers/{id}': {
      get: {
        tags: ['Workers'],
        summary: 'Get worker by ID',
        description: 'Returns a specific worker profile.',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            in: 'path',
            name: 'id',
            required: true,
            schema: { type: 'string' },
            description: 'Worker ID',
          },
        ],
        responses: {
          '200': {
            description: 'Worker profile',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Worker' },
              },
            },
          },
          '404': {
            description: 'Not found - worker does not exist',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
          '400': {
            description: 'Bad request',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
        },
      },
      patch: {
        tags: ['Workers'],
        summary: 'Update worker profile',
        description: 'Updates the worker profile. Only the owner can update their own profile.',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            in: 'path',
            name: 'id',
            required: true,
            schema: { type: 'string' },
            description: 'Worker ID',
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/UpdateWorkerRequest' },
            },
          },
        },
        responses: {
          '200': {
            description: 'Worker profile updated',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Worker' },
              },
            },
          },
          '400': {
            description: 'Bad request - invalid input',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
          '401': {
            description: 'Unauthorized - missing token',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
          '403': {
            description: 'Forbidden - can only update own profile',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
        },
      },
    },
    '/workers/{id}/reviews': {
      get: {
        tags: ['Workers'],
        summary: 'Get worker reviews',
        description: 'Returns all reviews for a specific worker.',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            in: 'path',
            name: 'id',
            required: true,
            schema: { type: 'string' },
            description: 'Worker ID',
          },
        ],
        responses: {
          '200': {
            description: 'List of worker reviews',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/WorkerReview' },
                },
              },
            },
          },
          '400': {
            description: 'Bad request',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
        },
      },
    },
    '/applications/': {
      post: {
        tags: ['Applications'],
        summary: 'Apply to a post',
        description: 'Creates a new application to a post. Worker role required.',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/CreateApplicationRequest' },
            },
          },
        },
        responses: {
          '201': {
            description: 'Application created successfully',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Application' },
              },
            },
          },
          '400': {
            description: 'Bad request - validation errors',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
                examples: {
                  missingPostId: {
                    summary: 'Missing postId',
                    value: { error: 'postId is required' },
                  },
                  missingDays: {
                    summary: 'Missing availableDays',
                    value: { error: 'availableDays is required and must be a non-empty array' },
                  },
                  missingTimeFrom: {
                    summary: 'Missing availableTimeFrom',
                    value: { error: 'availableTimeFrom is required' },
                  },
                  missingTimeTo: {
                    summary: 'Missing availableTimeTo',
                    value: { error: 'availableTimeTo is required' },
                  },
                  missingChargesVisit: {
                    summary: 'Missing chargesVisit',
                    value: { error: 'chargesVisit is required and must be a boolean' },
                  },
                },
              },
            },
          },
          '401': {
            description: 'Unauthorized',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
        },
      },
    },
    '/applications/post/{postId}': {
      get: {
        tags: ['Applications'],
        summary: 'Get applications for a post',
        description: 'Returns all applications for a specific post. Only the post owner can view.',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            in: 'path',
            name: 'postId',
            required: true,
            schema: { type: 'string' },
            description: 'Post ID',
          },
        ],
        responses: {
          '200': {
            description: 'List of applications',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/Application' },
                },
              },
            },
          },
          '400': {
            description: 'Bad request',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
          '401': {
            description: 'Unauthorized',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
        },
      },
    },
    '/applications/my-applications': {
      get: {
        tags: ['Applications'],
        summary: 'Get my applications',
        description: 'Returns all applications submitted by the authenticated worker.',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': {
            description: 'List of my applications',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/Application' },
                },
              },
            },
          },
          '400': {
            description: 'Bad request',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
          '401': {
            description: 'Unauthorized',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
        },
      },
    },
    '/applications/{id}': {
      delete: {
        tags: ['Applications'],
        summary: 'Cancel an application',
        description: 'Cancels a pending application. Only the applicant can cancel.',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            in: 'path',
            name: 'id',
            required: true,
            schema: { type: 'string' },
            description: 'Application ID',
          },
        ],
        responses: {
          '200': {
            description: 'Application cancelled',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Application' },
              },
            },
          },
          '400': {
            description: 'Bad request - cannot cancel this application',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
          '401': {
            description: 'Unauthorized',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
        },
      },
    },
    '/applications/subcontract': {
      post: {
        tags: ['Applications'],
        summary: 'Apply to a subcontract',
        description: 'Creates a new application to a subcontract. Worker role required.',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/CreateSubcontractApplicationRequest' },
            },
          },
        },
        responses: {
          '201': {
            description: 'Application created successfully',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Application' },
              },
            },
          },
          '400': {
            description: 'Bad request - validation errors',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
                examples: {
                  missingPostId: {
                    summary: 'Missing postId',
                    value: { error: 'postId is required' },
                  },
                  missingCategoryId: {
                    summary: 'Missing categoryId',
                    value: { error: 'categoryId is required' },
                  },
                },
              },
            },
          },
          '401': {
            description: 'Unauthorized',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
        },
      },
    },
    '/applications/{applicationId}/accept': {
      patch: {
        tags: ['Applications'],
        summary: 'Accept an application',
        description: 'Accepts a worker application. Only the post owner can accept.',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            in: 'path',
            name: 'applicationId',
            required: true,
            schema: { type: 'string' },
            description: 'Application ID',
          },
        ],
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  scheduledDate: { type: 'string', format: 'date', description: 'Scheduled date for the job' },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Application accepted',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Application' },
              },
            },
          },
          '400': {
            description: 'Bad request - cannot accept this application',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
          '401': {
            description: 'Unauthorized',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
        },
      },
    },
    '/applications/{applicationId}/reject': {
      patch: {
        tags: ['Applications'],
        summary: 'Reject an application',
        description: 'Rejects a worker application. Only the post owner can reject.',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            in: 'path',
            name: 'applicationId',
            required: true,
            schema: { type: 'string' },
            description: 'Application ID',
          },
        ],
        responses: {
          '200': {
            description: 'Application rejected',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Application' },
              },
            },
          },
          '400': {
            description: 'Bad request - cannot reject this application',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
          '401': {
            description: 'Unauthorized',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
        },
      },
    },
    '/applications/{applicationId}/dismiss': {
      patch: {
        tags: ['Applications'],
        summary: 'Dismiss a worker',
        description: 'Dismisses an accepted worker application. Only the post owner can dismiss.',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            in: 'path',
            name: 'applicationId',
            required: true,
            schema: { type: 'string' },
            description: 'Application ID',
          },
        ],
        responses: {
          '200': {
            description: 'Worker dismissed',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Application' },
              },
            },
          },
          '400': {
            description: 'Bad request - cannot dismiss this worker',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
          '401': {
            description: 'Unauthorized',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
        },
      },
    },
    '/categories/': {
      get: {
        tags: ['Categories'],
        summary: 'List all categories',
        description: 'Returns all available service categories. No authentication required.',
        responses: {
          '200': {
            description: 'List of categories',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/Category' },
                },
              },
            },
          },
          '500': {
            description: 'Internal server error',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
        },
      },
    },
    '/reviews/': {
      post: {
        tags: ['Reviews'],
        summary: 'Create a worker review',
        description: 'Creates a review for a worker after completing a job. Requires authentication.',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/CreateWorkerReviewRequest' },
            },
          },
        },
        responses: {
          '201': {
            description: 'Review created successfully',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Review' },
              },
            },
          },
          '400': {
            description: 'Bad request - invalid review data',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
          '401': {
            description: 'Unauthorized',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
        },
      },
    },
    '/reviews/client': {
      post: {
        tags: ['Reviews'],
        summary: 'Create a client review',
        description: 'Creates a review for a client after completing a job. Requires authentication.',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/CreateClientReviewRequest' },
            },
          },
        },
        responses: {
          '201': {
            description: 'Review created successfully',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Review' },
              },
            },
          },
          '400': {
            description: 'Bad request - invalid review data',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
          '401': {
            description: 'Unauthorized',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
        },
      },
    },
    '/kyc/session': {
      post: {
        tags: ['KYC'],
        summary: 'Start KYC verification session',
        description: 'Creates a new KYC verification session with Didit. Requires authentication.',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': {
            description: 'KYC session created',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/KycSessionResponse' },
              },
            },
          },
          '400': {
            description: 'Bad request - token without email',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
                example: { error: 'Token autenticado sin email' },
              },
            },
          },
          '500': {
            description: 'Internal server error',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
        },
      },
    },
    '/kyc/confirm': {
      post: {
        tags: ['KYC'],
        summary: 'Confirm KYC verification',
        description: 'Confirms a KYC verification session. Rate limited to 10 requests per minute per IP. No authentication required.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/KycConfirmRequest' },
            },
          },
        },
        responses: {
          '200': {
            description: 'KYC confirmed',
            content: {
              'application/json': {
                schema: { type: 'object' },
              },
            },
          },
          '400': {
            description: 'Bad request - missing sessionId or email',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
                example: { error: 'sessionId y email son requeridos' },
              },
            },
          },
          '429': {
            description: 'Too many requests - rate limit exceeded',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
                example: { error: 'Demasiadas solicitudes, intentá de nuevo en un minuto' },
              },
            },
          },
          '500': {
            description: 'Internal server error',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
        },
      },
    },
    '/kyc/status': {
      get: {
        tags: ['KYC'],
        summary: 'Get KYC verification status',
        description: 'Returns the current KYC status for the authenticated user.',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': {
            description: 'KYC status',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/KycStatusResponse' },
              },
            },
          },
          '400': {
            description: 'Bad request - token without email',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
          '500': {
            description: 'Internal server error',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
        },
      },
    },
    '/kyc/decision/{sessionId}': {
      get: {
        tags: ['KYC'],
        summary: 'Get KYC decision for a session',
        description: 'Returns the KYC decision (approved/rejected/pending) for a specific session.',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            in: 'path',
            name: 'sessionId',
            required: true,
            schema: { type: 'string' },
            description: 'KYC Session ID',
          },
        ],
        responses: {
          '200': {
            description: 'KYC decision',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/KycDecisionResponse' },
              },
            },
          },
          '400': {
            description: 'Bad request - missing sessionId',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
                example: { error: 'sessionId es requerido' },
              },
            },
          },
          '500': {
            description: 'Internal server error',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
        },
      },
    },
    '/kyc/webhook': {
      post: {
        tags: ['KYC'],
        summary: 'KYC webhook receiver',
        description: 'Receives webhook notifications from Didit KYC service. Uses signature verification (V2 or simple). No JWT authentication required, but requires valid Didit signature headers.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/KycWebhookRequest' },
            },
          },
        },
        responses: {
          '200': {
            description: 'Webhook processed (always returns 200 to Didit)',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/WebhookResponse' },
              },
            },
          },
          '401': {
            description: 'Unauthorized - missing or invalid signature',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
                examples: {
                  missingTimestamp: {
                    summary: 'Missing X-Timestamp header',
                    value: { error: 'Missing X-Timestamp header' },
                  },
                  invalidSignature: {
                    summary: 'Invalid signature',
                    value: { error: 'Invalid signature' },
                  },
                },
              },
            },
          },
          '500': {
            description: 'Webhook not configured (DIDIT_WEBHOOK_SECRET missing)',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
                example: { error: 'Webhook not configured' },
              },
            },
          },
        },
      },
    },
    '/upload/': {
      post: {
        tags: ['Upload'],
        summary: 'Upload images',
        description: 'Uploads one or more images to Cloudinary. Max 10 files, 10MB each. Requires authentication.',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                required: ['files'],
                properties: {
                  files: {
                    type: 'array',
                    items: {
                      type: 'string',
                      format: 'binary',
                    },
                    maxItems: 10,
                    description: 'Image files (max 10 files, 10MB each)',
                  },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Images uploaded successfully',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/UploadResponse' },
              },
            },
          },
          '400': {
            description: 'Bad request - no files sent',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
                example: { error: 'No se enviaron archivos' },
              },
            },
          },
          '401': {
            description: 'Unauthorized',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
          '500': {
            description: 'Internal server error - upload failed',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
        },
      },
    },
    '/telegram/link': {
      post: {
        tags: ['Telegram'],
        summary: 'Link Telegram account',
        description: 'Generates a link code to connect a Telegram account. Requires authentication.',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': {
            description: 'Link code generated',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/TelegramLinkResponse' },
              },
            },
          },
          '401': {
            description: 'Unauthorized',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
          '500': {
            description: 'Internal server error',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
        },
      },
    },
    '/telegram/status': {
      get: {
        tags: ['Telegram'],
        summary: 'Get Telegram link status',
        description: 'Returns whether the user has linked their Telegram account.',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': {
            description: 'Telegram link status',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/TelegramStatusResponse' },
              },
            },
          },
          '401': {
            description: 'Unauthorized',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
          '500': {
            description: 'Internal server error',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
        },
      },
    },
    '/telegram/unlink': {
      delete: {
        tags: ['Telegram'],
        summary: 'Unlink Telegram account',
        description: 'Removes the Telegram link from the user account.',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': {
            description: 'Telegram unlinked',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    message: { type: 'string', example: 'Telegram desvinculado' },
                  },
                },
              },
            },
          },
          '401': {
            description: 'Unauthorized',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
          '500': {
            description: 'Internal server error',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
        },
      },
    },
    '/client/stats': {
      get: {
        tags: ['Client'],
        summary: 'Get client statistics',
        description: 'Returns statistics for the authenticated client: completed posts, cancelled posts, unreviewed jobs, and rating.',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': {
            description: 'Client statistics',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ClientStatsResponse' },
              },
            },
          },
          '401': {
            description: 'Unauthorized',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
          '500': {
            description: 'Internal server error',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
        },
      },
    },
    '/client/posts': {
      get: {
        tags: ['Client'],
        summary: 'Get client post history',
        description: 'Returns paginated list of posts created by the authenticated client.',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            in: 'query',
            name: 'page',
            schema: { type: 'integer', default: 1, minimum: 1 },
            description: 'Page number',
          },
          {
            in: 'query',
            name: 'limit',
            schema: { type: 'integer', default: 10, minimum: 1, maximum: 50 },
            description: 'Items per page',
          },
        ],
        responses: {
          '200': {
            description: 'Paginated list of client posts',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    data: { type: 'array', items: { $ref: '#/components/schemas/Post' } },
                    total: { type: 'integer' },
                    page: { type: 'integer' },
                    limit: { type: 'integer' },
                  },
                },
              },
            },
          },
          '401': {
            description: 'Unauthorized',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
          '500': {
            description: 'Internal server error',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
        },
      },
    },
    '/client-profiles/{id}': {
      get: {
        tags: ['Client Profiles'],
        summary: 'Get client profile',
        description: 'Returns a client profile. Contact fields are only visible to the profile owner.',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            in: 'path',
            name: 'id',
            required: true,
            schema: { type: 'string' },
            description: 'Client user ID',
          },
        ],
        responses: {
          '200': {
            description: 'Client profile',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ClientProfile' },
              },
            },
          },
          '404': {
            description: 'Not found - client does not exist',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
          '500': {
            description: 'Internal server error',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
        },
      },
      patch: {
        tags: ['Client Profiles'],
        summary: 'Update client profile',
        description: 'Updates the client profile. Only the owner can update their own profile.',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            in: 'path',
            name: 'id',
            required: true,
            schema: { type: 'string' },
            description: 'Client user ID',
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/UpdateClientProfileRequest' },
            },
          },
        },
        responses: {
          '200': {
            description: 'Profile updated',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ClientProfile' },
              },
            },
          },
          '400': {
            description: 'Bad request - invalid input',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
          '401': {
            description: 'Unauthorized',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
          '403': {
            description: 'Forbidden - can only update own profile',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
        },
      },
    },
    '/worker-dashboard/': {
      get: {
        tags: ['Worker Dashboard'],
        summary: 'Get worker dashboard',
        description: 'Returns dashboard data for the authenticated worker: active jobs, pending applications, completed jobs, earnings, and recent activity.',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': {
            description: 'Worker dashboard data',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/WorkerDashboard' },
              },
            },
          },
          '401': {
            description: 'Unauthorized',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
          '500': {
            description: 'Internal server error',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
        },
      },
    },
    '/ai/suggest': {
      post: {
        tags: ['AI'],
        summary: 'Suggest a post using AI',
        description: 'Uses Google Generative AI to suggest post details based on a problem description.',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/SuggestPostRequest' },
            },
          },
        },
        responses: {
          '200': {
            description: 'AI suggestion generated',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/SuggestPostResponse' },
              },
            },
          },
          '400': {
            description: 'Bad request - invalid input or AI error',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
          '401': {
            description: 'Unauthorized',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
          '500': {
            description: 'Internal server error',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
        },
      },
    },
    '/users/': {
      get: {
        tags: ['Users'],
        summary: 'List all users',
        description: 'Returns a list of all registered users in the system.',
        responses: {
          '200': {
            description: 'List of users',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/UserListItem' },
                },
              },
            },
          },
          '500': {
            description: 'Internal server error',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
        },
      },
    },
    '/users/{id}/reviews': {
      get: {
        tags: ['Users'],
        summary: 'Get user reviews',
        description: 'Returns reviews for a specific user. Optionally filter by review target (worker or client).',
        parameters: [
          {
            in: 'path',
            name: 'id',
            required: true,
            schema: { type: 'string' },
            description: 'User ID',
          },
          {
            in: 'query',
            name: 'as',
            required: false,
            schema: { type: 'string', enum: ['worker', 'client'] },
            description: 'Filter reviews by target type',
          },
        ],
        responses: {
          '200': {
            description: 'List of user reviews',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/UserReview' },
                },
              },
            },
          },
          '500': {
            description: 'Internal server error',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
        },
      },
    },
    '/users/{id}/rating': {
      get: {
        tags: ['Users'],
        summary: 'Get user rating',
        description: 'Returns the average rating and total review count for a specific user.',
        parameters: [
          {
            in: 'path',
            name: 'id',
            required: true,
            schema: { type: 'string' },
            description: 'User ID',
          },
        ],
        responses: {
          '200': {
            description: 'User rating details',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/UserRating' },
              },
            },
          },
          '500': {
            description: 'Internal server error',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
        },
      },
    },
    '/users/{id}/emergencies': {
      patch: {
        tags: ['Users'],
        summary: 'Set emergency notifications',
        description: 'Enables or disables emergency notifications for a user. Only the owner can update this setting.',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            in: 'path',
            name: 'id',
            required: true,
            schema: { type: 'string' },
            description: 'User ID',
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/EmergencyNotificationRequest' },
            },
          },
        },
        responses: {
          '200': {
            description: 'Emergency notifications updated',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    message: { type: 'string', example: 'Notificaciones de emergencia actualizadas' },
                  },
                },
              },
            },
          },
          '400': {
            description: 'Bad request - enabled must be a boolean',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
                example: { error: 'enabled debe ser un booleano' },
              },
            },
          },
          '401': {
            description: 'Unauthorized - missing token',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
          '403': {
            description: 'Forbidden - can only update own settings',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
          '500': {
            description: 'Internal server error',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
        },
      },
    },
  },
  tags: [
    { name: 'Health', description: 'Health check endpoints' },
    { name: 'Auth', description: 'Authentication and registration' },
    { name: 'Users', description: 'User management, ratings and reviews' },
    { name: 'Posts', description: 'Post management and subcontracts' },
    { name: 'Workers', description: 'Worker profiles and reviews' },
    { name: 'Applications', description: 'Job applications management' },
    { name: 'Categories', description: 'Service categories' },
    { name: 'Reviews', description: 'User reviews' },
    { name: 'KYC', description: 'Identity verification (Didit)' },
    { name: 'Upload', description: 'File uploads (Cloudinary)' },
    { name: 'Telegram', description: 'Telegram bot integration' },
    { name: 'Client', description: 'Client statistics and history' },
    { name: 'Client Profiles', description: 'Client profile management' },
    { name: 'Worker Dashboard', description: 'Worker dashboard data' },
    { name: 'AI', description: 'AI-powered features' },
  ],
}

export default swaggerDocument
