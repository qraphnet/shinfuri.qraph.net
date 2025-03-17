import type { KVNamespace, PagesFunction } from '@cloudflare/workers-types/experimental';
import { z }                               from 'zod';

interface Env {
  'shinfuri-floating-point-survey-answer': KVNamespace;
}

export const onRequestPost = async (context: Parameters<PagesFunction<Env>>[0]) => {
  const data = await context.request.json();
  const p    = SurveyAnswer.safeParse(data);
  console.log(p);
  if (p.success) {
    await context.env['shinfuri-floating-point-survey-answer'].put('' + Date.now(), JSON.stringify(p.data));
    return new Response(null, { status: 200 });
  } else {
    return new Response('invalid data', { status: 400 });
  }
};

const SurveyAnswer = z.union([
  z.object({
    which: z.enum(['rational', 'floating-point', 'no-difference']),
  }),
  z.object({
    which : z.literal('neither'),
    actual: z.string(),
    data  : z.nullable(z.object({
      profile: z.any(),
      reports: z.any(),
    }).or(z.object({
      rational: z.number(),
      fp      : z.number(),
    }))),
  }),
]);

export type SurveyAnswer = z.infer<typeof SurveyAnswer>;

