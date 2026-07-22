import { CheckCircle } from "lucide-react";

type ConfirmSuccessProps = {
  title: string;
  description: string;
  id?: string;
  name?: string;
};

export const ConfirmSuccess = ({
  title,
  description,
  id,
  name,
}: ConfirmSuccessProps) => {
  return (
    <div className="rounded-lg border border-green-200 bg-green-50 p-4">
      <div className="flex items-start gap-3">
        <div className="flex items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
          <CheckCircle className="h-9 w-9 text-green-600 dark:text-green-500" />
        </div>

        <div className="space-y-1">
          {title && <h3 className="font-medium text-green-900 text-lg">
            {title}
          </h3>}

          {description && <p className="mt-1 text-base text-green-700">
            {description}
          </p>}

          {(id || name) && (
            <p className="mt-2 text-base text-green-600">
              {name ? `Room: ${name}` : ''}
              {id ? ` - ID: ${id}` : ''}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
