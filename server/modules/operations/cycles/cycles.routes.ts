/**
 * Route per il modulo cicli
 */

import { Router } from 'express';
import { cyclesController } from './cycles.controller';

const router = Router();

// Route di query specifiche (prima delle route parametriche)
router.get('/active', (req, res) => cyclesController.getActiveCycles(req, res));
router.get('/active-with-details', (req, res) => cyclesController.getActiveCyclesWithDetails(req, res));
router.get('/basket/:basketId', (req, res) => cyclesController.getCyclesByBasket(req, res));
router.get('/pending-closures', (req, res) => cyclesController.getPendingClosures(req, res));
router.get('/pending-closures/count', (req, res) => cyclesController.getPendingClosuresCount(req, res));

// Route CRUD principali
router.get('/', (req, res) => cyclesController.getCycles(req, res));
router.get('/:id', (req, res) => cyclesController.getCycle(req, res));
router.post('/', (req, res) => cyclesController.createCycle(req, res));

// Route di azioni specifiche
router.post('/:id/close', (req, res) => cyclesController.closeCycle(req, res));
router.post('/pending-closures/:id/resolve', (req, res) => cyclesController.resolvePendingClosure(req, res));
router.post('/pending-closures/:id/cancel', (req, res) => cyclesController.cancelPendingClosure(req, res));

export default router;
