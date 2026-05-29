import { FastifyPluginAsync } from 'fastify';
import { ReportService } from '../../services/report.service.js';
import { authenticate } from '../../middleware/authenticate.js';
import { createReportSchema } from '@gem/validators';

const reportRoutes: FastifyPluginAsync = async (fastify) => {
  const reportService = new ReportService(fastify);

  fastify.post('/', { preHandler: authenticate }, async (request, reply) => {
    const data = createReportSchema.parse(request.body);
    const report = await reportService.createReport(request.user!.id, data);
    return reply.status(201).send({ data: report });
  });
};

export default reportRoutes;
