import { CallHandler, ExecutionContext } from '@nestjs/common';
import { of } from 'rxjs';
import { ResponseTransformInterceptor } from './response-transform.interceptor';

describe('ResponseTransformInterceptor', () => {
  let interceptor: ResponseTransformInterceptor<unknown>;

  beforeEach(() => {
    interceptor = new ResponseTransformInterceptor();
  });

  it('should be defined', () => {
    expect(interceptor).toBeDefined();
  });

  function createMockContext(statusCode: number): ExecutionContext {
    return {
      switchToHttp: jest.fn().mockReturnValue({
        getResponse: () => ({ statusCode }),
      }),
    } as unknown as ExecutionContext;
  }

  function createMockHandler(data: unknown): CallHandler {
    return { handle: () => of(data) } as CallHandler;
  }

  it('should wrap response data with success=true and statusCode', (done) => {
    const context = createMockContext(200);
    const handler = createMockHandler({ id: 1, name: 'Test' });

    interceptor.intercept(context, handler).subscribe((result) => {
      expect(result.success).toBe(true);
      expect(result.data).toEqual({ id: 1, name: 'Test' });
      expect(result.statusCode).toBe(200);
      done();
    });
  });

  it('should wrap 201 status code correctly', (done) => {
    const context = createMockContext(201);
    const handler = createMockHandler({ created: true });

    interceptor.intercept(context, handler).subscribe((result) => {
      expect(result.statusCode).toBe(201);
      expect(result.data).toEqual({ created: true });
      done();
    });
  });

  it('should handle null data', (done) => {
    const context = createMockContext(200);
    const handler = createMockHandler(null);

    interceptor.intercept(context, handler).subscribe((result) => {
      expect(result.success).toBe(true);
      expect(result.data).toBeNull();
      done();
    });
  });

  it('should handle array data', (done) => {
    const context = createMockContext(200);
    const handler = createMockHandler([1, 2, 3]);

    interceptor.intercept(context, handler).subscribe((result) => {
      expect(result.data).toEqual([1, 2, 3]);
      done();
    });
  });

  it('should include timestamp in response', (done) => {
    const context = createMockContext(200);
    const handler = createMockHandler({});

    interceptor.intercept(context, handler).subscribe((result) => {
      expect((result as unknown as Record<string, unknown>)['timestamp']).toBeDefined();
      done();
    });
  });
});
