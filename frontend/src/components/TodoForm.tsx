import { useForm } from 'react-hook-form';
import type { Resolver, SubmitHandler } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useCreateTodo } from '../hooks/useTodos';
import './TodoForm.css';

const todoFormSchema = yup
  .object({
    title: yup
      .string()
      .trim()
      .min(1, 'Title is required')
      .max(120, 'Title is too long')
      .required('Title is required'),
    description: yup
      .string()
      .trim()
      .max(500, 'Description is too long')
      .optional(),
    tagsInput: yup.string().trim().max(200, 'Tags are too long').optional(),
    deadline: yup.string().trim().optional(),
  })
  .required();

type TodoFormValues = {
  title: string;
  description?: string;
  tagsInput?: string;
  deadline?: string;
};

export default function TodoForm() {
  const createTodo = useCreateTodo();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<TodoFormValues>({
    defaultValues: {
      title: '',
      description: '',
      tagsInput: '',
      deadline: '',
    },
    resolver: yupResolver(todoFormSchema) as Resolver<TodoFormValues>,
  });

  const onSubmit: SubmitHandler<TodoFormValues> = values => {
    const tags = values.tagsInput
      ? values.tagsInput
          .split(',')
          .map(tag => tag.trim())
          .filter(tag => tag.length > 0)
      : undefined;
    const deadline = values.deadline ? new Date(`${values.deadline}T00:00:00Z`).toISOString() : undefined;

    createTodo.mutate(
      {
        title: values.title.trim(),
        description: values.description?.trim() || undefined,
        tags,
        deadline,
      },
      {
        onSuccess: () => {
          reset();
        },
      }
    );
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="todo-form">
      <input
        type="text"
        {...register('title')}
        placeholder="Что нужно сделать?"
        disabled={createTodo.isPending}
      />
      <textarea
        {...register('description')}
        placeholder="Описание (опционально)"
        disabled={createTodo.isPending}
      />
      <input
        type="text"
        {...register('tagsInput')}
        placeholder="Теги через запятую (например: работа, дом)"
        disabled={createTodo.isPending}
      />
      <input type="date" {...register('deadline')} disabled={createTodo.isPending} />
      {(errors.title?.message || errors.description?.message || errors.tagsInput?.message || errors.deadline?.message) && (
        <div className="todo-error">
          {errors.title?.message ||
            errors.description?.message ||
            errors.tagsInput?.message ||
            errors.deadline?.message}
        </div>
      )}
      <button type="submit" disabled={createTodo.isPending}>
        {createTodo.isPending ? 'Добавление...' : 'Добавить'}
      </button>
    </form>
  );
}
