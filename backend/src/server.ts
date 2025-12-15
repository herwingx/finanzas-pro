import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser'; // Import body-parser
import authRoutes from './routes/auth';
import transactionRoutes from './routes/transactions';
import categoryRoutes from './routes/categories';
import profileRoutes from './routes/profile';
import recurringRoutes from './routes/recurring';
import accountsRoutes from './routes/accounts';
import installmentsRoutes from './routes/installments';
import financialPlanningRoutes from './routes/financialPlanningRoutes';
import creditCardPaymentsRoutes from './routes/creditCardPayments';
import loansRoutes from './routes/loans';

const app = express();

app.use(cors());
app.use(bodyParser.json()); // Use body-parser for JSON
app.use(bodyParser.urlencoded({ extended: true })); // Use body-parser for URL-encoded data

app.get('/', (req, res) => {
  res.send('Finanzas Pro Backend is running!');
});

app.use('/api/auth', authRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/recurring', recurringRoutes);
app.use('/api/accounts', accountsRoutes);
app.use('/api/installments', installmentsRoutes);
app.use('/api/financial-planning', financialPlanningRoutes);
app.use('/api/credit-card', creditCardPaymentsRoutes);
app.use('/api/loans', loansRoutes);

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
